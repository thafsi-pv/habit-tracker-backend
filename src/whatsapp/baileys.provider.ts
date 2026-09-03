import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { usePostgresAuthState, clearAuthState } from './postgres-auth-state';
import { WhatsAppGateway } from './whatsapp.gateway';
import {
  SendMessageResult,
  WhatsAppProvider,
  WhatsAppStatus,
} from './whatsapp-provider.interface';

interface Session {
  socket: WASocket;
  status: WhatsAppStatus;
}

@Injectable()
export class BaileysWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(BaileysWhatsAppProvider.name);
  // In-memory only for the live socket handle — durable state (creds/keys/
  // status) lives in Postgres via postgres-auth-state.ts and WhatsAppSession.
  private sessions = new Map<string, Session>();

  constructor(
    private prisma: PrismaService,
    private gateway: WhatsAppGateway,
  ) {}

  async connect(userId: string): Promise<void> {
    const existing = this.sessions.get(userId);
    if (existing?.socket) {
      return; // already connecting/connected
    }

    const { state, saveCreds } = await usePostgresAuthState(this.prisma, userId);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false,
    });

    this.sessions.set(userId, { socket, status: { status: 'CONNECTING' } });
    await this.setStatus(userId, { status: 'CONNECTING' });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr);
        await this.setStatus(userId, { status: 'CONNECTING', qr: qrDataUrl });
      }

      if (connection === 'open') {
        const phoneNumber = socket.user?.id?.split(':')[0] ?? null;
        await this.setStatus(userId, { status: 'CONNECTED', phoneNumber, qr: null });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        this.sessions.delete(userId);

        if (loggedOut) {
          await clearAuthState(this.prisma, userId);
          await this.setStatus(userId, { status: 'DISCONNECTED', phoneNumber: null, qr: null });
        } else {
          // Transient network/restart-type close — attempt one reconnect.
          this.logger.warn(`WhatsApp connection closed for user ${userId}, reconnecting`);
          await this.setStatus(userId, { status: 'CONNECTING', qr: null });
          await this.connect(userId);
        }
      }
    });
  }

  async disconnect(userId: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (session) {
      await session.socket.logout().catch(() => undefined);
      this.sessions.delete(userId);
    }
    await clearAuthState(this.prisma, userId);
    await this.setStatus(userId, { status: 'DISCONNECTED', phoneNumber: null, qr: null });
  }

  async getStatus(userId: string): Promise<WhatsAppStatus> {
    const live = this.sessions.get(userId);
    if (live) return live.status;

    const record = await this.prisma.whatsAppSession.findUnique({ where: { userId } });
    if (!record) return { status: 'DISCONNECTED' };
    return {
      status: record.status as WhatsAppStatus['status'],
      phoneNumber: record.phoneNumber,
    };
  }

  async sendText(userId: string, recipient: string, message: string): Promise<SendMessageResult> {
    const session = await this.ensureConnected(userId);
    if (!session) return { success: false, error: 'WhatsApp is not connected' };
    try {
      const jid = this.toJid(recipient);
      await session.sendMessage(jid, { text: message });
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp message to user ${userId}`, err as Error);
      return { success: false, error: (err as Error).message };
    }
  }

  async sendImage(
    userId: string,
    recipient: string,
    image: Buffer,
    caption?: string,
    mimetype?: string,
  ): Promise<SendMessageResult> {
    const session = await this.ensureConnected(userId);
    if (!session) return { success: false, error: 'WhatsApp is not connected' };
    try {
      const jid = this.toJid(recipient);
      await session.sendMessage(jid, {
        image,
        caption: caption ?? '',
        mimetype: mimetype ?? 'image/png',
      });
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp image to user ${userId}`, err as Error);
      return { success: false, error: (err as Error).message };
    }
  }

  private toJid(recipient: string): string {
    return recipient.includes('@') ? recipient : `${recipient.replace(/\D/g, '')}@s.whatsapp.net`;
  }

  private async ensureConnected(userId: string): Promise<WASocket | null> {
    let session = this.sessions.get(userId);
    if (!session || session.status.status !== 'CONNECTED') {
      const record = await this.prisma.whatsAppSession.findUnique({ where: { userId } });
      if (record?.status === 'CONNECTED') {
        this.logger.log(`Auto-reconnecting WhatsApp for user ${userId} (session lost after restart)`);
        await this.connect(userId);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        session = this.sessions.get(userId);
      }
    }
    return session?.status.status === 'CONNECTED' ? session.socket : null;
  }

  private async setStatus(userId: string, status: WhatsAppStatus): Promise<void> {
    const session = this.sessions.get(userId);
    if (session) session.status = status;

    await this.prisma.whatsAppSession.upsert({
      where: { userId },
      create: { userId, status: status.status, phoneNumber: status.phoneNumber ?? null },
      update: { status: status.status, phoneNumber: status.phoneNumber ?? null },
    });

    this.gateway.emitStatus(userId, status);
  }
}
