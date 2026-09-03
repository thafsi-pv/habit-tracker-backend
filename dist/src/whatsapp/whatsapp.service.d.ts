import { SendMessageResult, WhatsAppProvider, WhatsAppStatus } from './whatsapp-provider.interface';
export declare class WhatsAppService {
    private provider;
    constructor(provider: WhatsAppProvider);
    connect(userId: string): Promise<void>;
    disconnect(userId: string): Promise<void>;
    getStatus(userId: string): Promise<WhatsAppStatus>;
    sendToUser(userId: string, message: string): Promise<SendMessageResult>;
    sendToNumber(senderUserId: string, recipientNumber: string, message: string): Promise<SendMessageResult>;
    sendImageToNumber(senderUserId: string, recipientNumber: string, image: Buffer, caption?: string): Promise<SendMessageResult>;
}
