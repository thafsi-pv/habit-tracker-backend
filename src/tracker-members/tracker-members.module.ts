import { Module } from '@nestjs/common';
import { TrackerMembersController } from './tracker-members.controller';
import { TrackerMembersService } from './tracker-members.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TrackerMembersController],
  providers: [TrackerMembersService],
})
export class TrackerMembersModule {}
