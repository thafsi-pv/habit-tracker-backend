import { Module } from '@nestjs/common';
import { DailyHabitsController } from './daily-habits.controller';
import { DailyHabitsService } from './daily-habits.service';

@Module({
  controllers: [DailyHabitsController],
  providers: [DailyHabitsService],
})
export class DailyHabitsModule {}
