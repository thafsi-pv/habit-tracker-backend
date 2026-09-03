import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get('daily')
  daily(@CurrentUser() user: AuthenticatedUser, @Query('trackerId') trackerId: string, @Query('date') date: string) {
    return this.progressService.getDailyProgress(user.userId, trackerId, date);
  }

  @Get('weekly')
  weekly(@CurrentUser() user: AuthenticatedUser, @Query('trackerId') trackerId: string) {
    return this.progressService.getWeeklyProgress(user.userId, trackerId);
  }

  @Get('monthly')
  monthly(@CurrentUser() user: AuthenticatedUser, @Query('trackerId') trackerId: string) {
    return this.progressService.getMonthlyProgress(user.userId, trackerId);
  }
}
