import { Module } from '@nestjs/common';
import { DailyHabitsController } from './daily-habits.controller';
import { DailyHabitsService } from './daily-habits.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DailyHabitsController],
  providers: [DailyHabitsService],
})
export class DailyHabitsModule {}
