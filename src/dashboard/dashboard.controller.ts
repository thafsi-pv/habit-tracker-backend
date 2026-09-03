import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('today')
  today(
    @CurrentUser() user: AuthenticatedUser,
    @Query('trackerId') trackerId: string,
    @Query('date') date?: string,
  ) {
    return this.dashboardService.getToday(user.userId, trackerId, date);
  }
}
