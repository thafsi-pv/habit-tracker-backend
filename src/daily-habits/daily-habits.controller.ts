import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { DailyHabitsService } from './daily-habits.service';
import { SetCompletionDto } from './dto/daily-habit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class DailyHabitsController {
  constructor(private dailyHabitsService: DailyHabitsService) {}

  @Get('daily-habits')
  getForTrackerAndDate(
    @CurrentUser() user: AuthenticatedUser,
    @Query('trackerId') trackerId: string,
    @Query('date') date: string,
  ) {
    return this.dailyHabitsService.getForTrackerAndDate(user.userId, trackerId, date);
  }

  @Patch('daily-habits/habit/:habitId')
  setHabit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('habitId') habitId: string,
    @Body() dto: SetCompletionDto,
  ) {
    return this.dailyHabitsService.setHabitCompletion(user.userId, habitId, dto);
  }

  @Patch('daily-habits/subtask/:subtaskId')
  setSubtask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: SetCompletionDto,
  ) {
    return this.dailyHabitsService.setSubtaskCompletion(user.userId, subtaskId, dto);
  }
}
