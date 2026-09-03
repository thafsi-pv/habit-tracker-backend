import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import { TrackerMembersService } from './tracker-members.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TrackerMemberGuard } from '../common/guards/tracker-member.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, TrackerMemberGuard)
@Controller('trackers/:trackerId/members')
export class TrackerMembersController {
  constructor(private membersService: TrackerMembersService) {}

  @Get()
  findAll(@Param('trackerId') trackerId: string) {
    return this.membersService.findAll(trackerId);
  }

  @Roles(TrackerRole.MASTER)
  @Delete(':userId')
  remove(@Param('trackerId') trackerId: string, @Param('userId') userId: string) {
    return this.membersService.remove(trackerId, userId);
  }
}
