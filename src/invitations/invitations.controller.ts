import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { TrackerRole } from '@prisma/client';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/invitation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TrackerMemberGuard } from '../common/guards/tracker-member.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

class AcceptByTokenDto {
  @IsString()
  token!: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Roles(TrackerRole.MASTER)
  @UseGuards(TrackerMemberGuard)
  @Post('trackers/:trackerId/invitations')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trackerId') trackerId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(trackerId, user.userId, dto);
  }

  @Roles(TrackerRole.MASTER)
  @UseGuards(TrackerMemberGuard)
  @Get('trackers/:trackerId/invitations')
  findAll(@Param('trackerId') trackerId: string) {
    return this.invitationsService.findAllForTracker(trackerId);
  }

  @Roles(TrackerRole.MASTER)
  @UseGuards(TrackerMemberGuard)
  @Delete('trackers/:trackerId/invitations/:invitationId')
  remove(@Param('trackerId') trackerId: string, @Param('invitationId') invitationId: string) {
    return this.invitationsService.remove(trackerId, invitationId);
  }

  @Get('invitations/pending')
  findPending(@CurrentUser() user: AuthenticatedUser) {
    return this.invitationsService.findPendingForUser(user.userId);
  }

  @Post('invitations/:invitationId/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('invitationId') invitationId: string) {
    return this.invitationsService.accept(user.userId, invitationId);
  }

  @Post('invitations/accept-by-token')
  acceptByToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: AcceptByTokenDto) {
    return this.invitationsService.acceptByToken(user.userId, dto.token);
  }
}
