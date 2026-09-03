export type WhatsAppConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

export interface WhatsAppStatus {
  status: WhatsAppConnectionStatus;
  phoneNumber?: string | null;
  qr?: string | null; // data-URL PNG, present only while status is CONNECTING and awaiting scan
}

export interface SendMessageResult {
  success: boolean;
  error?: string;
}

/**
 * Notification/scheduler code depends only on this interface, never on
 * Baileys directly. Swapping BaileysWhatsAppProvider for a future
 * MetaWhatsAppProvider (official Cloud API) requires no changes outside
 * whatsapp.module.ts.
 */
export interface WhatsAppProvider {
  connect(userId: string): Promise<void>;
  disconnect(userId: string): Promise<void>;
  getStatus(userId: string): Promise<WhatsAppStatus>;
  sendText(senderUserId: string, recipient: string, message: string): Promise<SendMessageResult>;
  sendImage(
    senderUserId: string,
    recipient: string,
    image: Buffer,
    caption?: string,
    mimetype?: string,
  ): Promise<SendMessageResult>;
}

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');
