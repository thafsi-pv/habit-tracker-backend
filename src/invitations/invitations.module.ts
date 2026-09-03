import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { EmailService } from './email.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, EmailService],
})
export class InvitationsModule {}
