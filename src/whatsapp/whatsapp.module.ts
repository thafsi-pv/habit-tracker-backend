import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppGateway } from './whatsapp.gateway';
import { BaileysWhatsAppProvider } from './baileys.provider';
import { WHATSAPP_PROVIDER } from './whatsapp-provider.interface';

// To add MetaWhatsAppProvider later: implement WhatsAppProvider, then swap
// the `useClass` below (or branch on process.env.WHATSAPP_PROVIDER). No
// other module needs to change.
@Module({
  imports: [JwtModule.register({})],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppGateway,
    WhatsAppService,
    { provide: WHATSAPP_PROVIDER, useClass: BaileysWhatsAppProvider },
  ],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
