import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsappService.getStatus(user.userId);
  }

  @Post('connect')
  async connect(@CurrentUser() user: AuthenticatedUser) {
    await this.whatsappService.connect(user.userId);
    // QR code arrives shortly after over the /whatsapp WebSocket namespace.
    return { started: true };
  }

  @Post('disconnect')
  async disconnect(@CurrentUser() user: AuthenticatedUser) {
    await this.whatsappService.disconnect(user.userId);
    return { success: true };
  }
}
