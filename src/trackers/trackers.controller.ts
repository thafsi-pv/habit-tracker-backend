import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import { TrackersService } from './trackers.service';
import { CreateTrackerDto, UpdateTrackerDto } from './dto/tracker.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TrackerMemberGuard } from '../common/guards/tracker-member.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('trackers')
export class TrackersController {
  constructor(private trackersService: TrackersService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTrackerDto) {
    return this.trackersService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.trackersService.findAllForUser(user.userId);
  }

  @UseGuards(TrackerMemberGuard)
  @Get(':trackerId')
  findOne(@Param('trackerId') trackerId: string) {
    return this.trackersService.findOne(trackerId);
  }

  @Roles(TrackerRole.MASTER)
  @UseGuards(TrackerMemberGuard)
  @Patch(':trackerId')
  update(@Param('trackerId') trackerId: string, @Body() dto: UpdateTrackerDto) {
    return this.trackersService.update(trackerId, dto);
  }

  @Roles(TrackerRole.MASTER)
  @UseGuards(TrackerMemberGuard)
  @Delete(':trackerId')
  remove(@Param('trackerId') trackerId: string) {
    return this.trackersService.remove(trackerId);
  }
}
