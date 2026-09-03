import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppGateway } from './whatsapp.gateway';
import { SendMessageResult, WhatsAppProvider, WhatsAppStatus } from './whatsapp-provider.interface';
export declare class BaileysWhatsAppProvider implements WhatsAppProvider {
    private prisma;
    private gateway;
    private readonly logger;
    private sessions;
    constructor(prisma: PrismaService, gateway: WhatsAppGateway);
    connect(userId: string): Promise<void>;
    disconnect(userId: string): Promise<void>;
    getStatus(userId: string): Promise<WhatsAppStatus>;
    sendText(userId: string, recipient: string, message: string): Promise<SendMessageResult>;
    sendImage(userId: string, recipient: string, image: Buffer, caption?: string, mimetype?: string): Promise<SendMessageResult>;
    private toJid;
    private ensureConnected;
    private setStatus;
}
