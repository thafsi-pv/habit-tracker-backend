export type WhatsAppConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
export interface WhatsAppStatus {
    status: WhatsAppConnectionStatus;
    phoneNumber?: string | null;
    qr?: string | null;
}
export interface SendMessageResult {
    success: boolean;
    error?: string;
}
export interface WhatsAppProvider {
    connect(userId: string): Promise<void>;
    disconnect(userId: string): Promise<void>;
    getStatus(userId: string): Promise<WhatsAppStatus>;
    sendText(senderUserId: string, recipient: string, message: string): Promise<SendMessageResult>;
    sendImage(senderUserId: string, recipient: string, image: Buffer, caption?: string, mimetype?: string): Promise<SendMessageResult>;
}
export declare const WHATSAPP_PROVIDER: unique symbol;
