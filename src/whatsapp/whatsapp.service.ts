import { Inject, Injectable } from '@nestjs/common';
import { CreateGroupResult, SendMessageResult, WHATSAPP_PROVIDER, WhatsAppProvider, WhatsAppStatus } from './whatsapp-provider.interface';

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

  /** Sends a text message directly to a WhatsApp group. */
  async sendToGroup(senderUserId: string, groupJid: string, message: string): Promise<SendMessageResult> {
    const status = await this.getStatus(senderUserId);
    if (status.status !== 'CONNECTED') {
      return { success: false, error: 'Sender WhatsApp is not connected' };
    }
    return this.provider.sendText(senderUserId, groupJid, message);
  }

  /** Sends an image message directly to a WhatsApp group. */
  async sendImageToGroup(
    senderUserId: string,
    groupJid: string,
    image: Buffer,
    caption?: string,
  ): Promise<SendMessageResult> {
    const status = await this.getStatus(senderUserId);
    if (status.status !== 'CONNECTED') {
      return { success: false, error: 'Sender WhatsApp is not connected' };
    }
    return this.provider.sendImage(senderUserId, groupJid, image, caption);
  }

  /** Creates a new WhatsApp group with aligned participant numbers. */
  async createGroup(
    senderUserId: string,
    groupName: string,
    participantNumbers: string[],
  ): Promise<CreateGroupResult> {
    const status = await this.getStatus(senderUserId);
    if (status.status !== 'CONNECTED') {
      return { success: false, error: 'Sender WhatsApp is not connected' };
    }
    return this.provider.createGroup(senderUserId, groupName, participantNumbers);
  }

  /** Adds participants to an existing WhatsApp group. */
  async addParticipantsToGroup(
    senderUserId: string,
    groupJid: string,
    participantNumbers: string[],
  ): Promise<SendMessageResult> {
    const status = await this.getStatus(senderUserId);
    if (status.status !== 'CONNECTED') {
      return { success: false, error: 'Sender WhatsApp is not connected' };
    }
    return this.provider.addParticipants(senderUserId, groupJid, participantNumbers);
  }

  /** Removes participants from an existing WhatsApp group. */
  async removeParticipantsFromGroup(
    senderUserId: string,
    groupJid: string,
    participantNumbers: string[],
  ): Promise<SendMessageResult> {
    const status = await this.getStatus(senderUserId);
    if (status.status !== 'CONNECTED') {
      return { success: false, error: 'Sender WhatsApp is not connected' };
    }
    return this.provider.removeParticipants(senderUserId, groupJid, participantNumbers);
  }
}
