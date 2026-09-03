import { Inject, Injectable } from '@nestjs/common';
import { SendMessageResult, WHATSAPP_PROVIDER, WhatsAppProvider, WhatsAppStatus } from './whatsapp-provider.interface';

@Injectable()
export class WhatsAppService {
  constructor(@Inject(WHATSAPP_PROVIDER) private provider: WhatsAppProvider) {}

  async connect(userId: string): Promise<void> {
    await this.provider.connect(userId);
  }

  async disconnect(userId: string): Promise<void> {
    await this.provider.disconnect(userId);
  }

  async getStatus(userId: string): Promise<WhatsAppStatus> {
    return this.provider.getStatus(userId);
  }

  /** Used by NotificationService — never called directly by a controller with a client-supplied userId. */
  async sendToUser(userId: string, message: string): Promise<SendMessageResult> {
    const status = await this.getStatus(userId);
    if (status.status !== 'CONNECTED' || !status.phoneNumber) {
      return { success: false, error: 'WhatsApp is not connected for this user' };
    }
    return this.provider.sendText(userId, status.phoneNumber, message);
  }

  /** Sends a message to a specific number using a specific user's WhatsApp connection (e.g. Master's connection). */
  async sendToNumber(senderUserId: string, recipientNumber: string, message: string): Promise<SendMessageResult> {
    const status = await this.getStatus(senderUserId);
    if (status.status !== 'CONNECTED' || !status.phoneNumber) {
      return { success: false, error: 'Sender WhatsApp is not connected' };
    }
    const cleanNumber = recipientNumber.replace(/\D/g, '');
    if (!cleanNumber) {
      return { success: false, error: 'Invalid recipient number' };
    }
    return this.provider.sendText(senderUserId, cleanNumber, message);
  }

  /** Sends an image to a specific number using the sender's WhatsApp connection. */
  async sendImageToNumber(
    senderUserId: string,
    recipientNumber: string,
    image: Buffer,
    caption?: string,
  ): Promise<SendMessageResult> {
    const status = await this.getStatus(senderUserId);
    if (status.status !== 'CONNECTED' || !status.phoneNumber) {
      return { success: false, error: 'Sender WhatsApp is not connected' };
    }
    const cleanNumber = recipientNumber.replace(/\D/g, '');
    if (!cleanNumber) {
      return { success: false, error: 'Invalid recipient number' };
    }
    return this.provider.sendImage(senderUserId, cleanNumber, image, caption);
  }
}
