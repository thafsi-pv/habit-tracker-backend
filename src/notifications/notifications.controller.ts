import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TrackerMemberGuard } from '../common/guards/tracker-member.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('trackers')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Roles(TrackerRole.MASTER)
  @UseGuards(TrackerMemberGuard)
  @Post(':trackerId/trigger-report')
  async triggerReport(@Param('trackerId') trackerId: string) {
    await this.notificationsService.sendTrackerReports(trackerId);
    return { success: true };
  }
}
