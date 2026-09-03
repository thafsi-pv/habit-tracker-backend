"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BaileysWhatsAppProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysWhatsAppProvider = void 0;
const common_1 = require("@nestjs/common");
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const QRCode = __importStar(require("qrcode"));
const prisma_service_1 = require("../prisma/prisma.service");
const postgres_auth_state_1 = require("./postgres-auth-state");
const whatsapp_gateway_1 = require("./whatsapp.gateway");
let BaileysWhatsAppProvider = BaileysWhatsAppProvider_1 = class BaileysWhatsAppProvider {
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.logger = new common_1.Logger(BaileysWhatsAppProvider_1.name);
        this.sessions = new Map();
    }
    async connect(userId) {
        const existing = this.sessions.get(userId);
        if (existing?.socket) {
            return;
        }
        const { state, saveCreds } = await (0, postgres_auth_state_1.usePostgresAuthState)(this.prisma, userId);
        const { version } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const socket = (0, baileys_1.default)({
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
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = statusCode === baileys_1.DisconnectReason.loggedOut;
                this.sessions.delete(userId);
                if (loggedOut) {
                    await (0, postgres_auth_state_1.clearAuthState)(this.prisma, userId);
                    await this.setStatus(userId, { status: 'DISCONNECTED', phoneNumber: null, qr: null });
                }
                else {
                    this.logger.warn(`WhatsApp connection closed for user ${userId}, reconnecting`);
                    await this.setStatus(userId, { status: 'CONNECTING', qr: null });
                    await this.connect(userId);
                }
            }
        });
    }
    async disconnect(userId) {
        const session = this.sessions.get(userId);
        if (session) {
            await session.socket.logout().catch(() => undefined);
            this.sessions.delete(userId);
        }
        await (0, postgres_auth_state_1.clearAuthState)(this.prisma, userId);
        await this.setStatus(userId, { status: 'DISCONNECTED', phoneNumber: null, qr: null });
    }
    async getStatus(userId) {
        const live = this.sessions.get(userId);
        if (live)
            return live.status;
        const record = await this.prisma.whatsAppSession.findUnique({ where: { userId } });
        if (!record)
            return { status: 'DISCONNECTED' };
        return {
            status: record.status,
            phoneNumber: record.phoneNumber,
        };
    }
    async sendText(userId, recipient, message) {
        const session = await this.ensureConnected(userId);
        if (!session)
            return { success: false, error: 'WhatsApp is not connected' };
        try {
            const jid = this.toJid(recipient);
            await session.sendMessage(jid, { text: message });
            return { success: true };
        }
        catch (err) {
            this.logger.error(`Failed to send WhatsApp message to user ${userId}`, err);
            return { success: false, error: err.message };
        }
    }
    async sendImage(userId, recipient, image, caption, mimetype) {
        const session = await this.ensureConnected(userId);
        if (!session)
            return { success: false, error: 'WhatsApp is not connected' };
        try {
            const jid = this.toJid(recipient);
            await session.sendMessage(jid, {
                image,
                caption: caption ?? '',
                mimetype: mimetype ?? 'image/png',
            });
            return { success: true };
        }
        catch (err) {
            this.logger.error(`Failed to send WhatsApp image to user ${userId}`, err);
            return { success: false, error: err.message };
        }
    }
    toJid(recipient) {
        return recipient.includes('@') ? recipient : `${recipient.replace(/\D/g, '')}@s.whatsapp.net`;
    }
    async ensureConnected(userId) {
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
    async setStatus(userId, status) {
        const session = this.sessions.get(userId);
        if (session)
            session.status = status;
        await this.prisma.whatsAppSession.upsert({
            where: { userId },
            create: { userId, status: status.status, phoneNumber: status.phoneNumber ?? null },
            update: { status: status.status, phoneNumber: status.phoneNumber ?? null },
        });
        this.gateway.emitStatus(userId, status);
    }
};
exports.BaileysWhatsAppProvider = BaileysWhatsAppProvider;
exports.BaileysWhatsAppProvider = BaileysWhatsAppProvider = BaileysWhatsAppProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_gateway_1.WhatsAppGateway])
], BaileysWhatsAppProvider);
//# sourceMappingURL=baileys.provider.js.map