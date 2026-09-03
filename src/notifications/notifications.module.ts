import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ReportCardService } from './report-card.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [WhatsAppModule, DashboardModule, ProgressModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, ReportCardService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
