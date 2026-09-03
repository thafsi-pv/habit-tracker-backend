import { Injectable, Logger } from '@nestjs/common';

/**
 * MVP email sender. No SMTP/API credentials were specified, so this logs
 * the email instead of sending it. Swap the body of `send` for a real
 * provider (Resend, SendGrid, SES, etc.) using env vars — the call site
 * (InvitationsService) doesn't need to change.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[email:stub] to=${to} subject="${subject}"\n${body}`);
  }
}
