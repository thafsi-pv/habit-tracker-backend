import { Module } from '@nestjs/common';
import { HabitSubtasksController } from './habit-subtasks.controller';
import { HabitSubtasksService } from './habit-subtasks.service';

@Module({
  controllers: [HabitSubtasksController],
  providers: [HabitSubtasksService],
})
export class HabitSubtasksModule {}
