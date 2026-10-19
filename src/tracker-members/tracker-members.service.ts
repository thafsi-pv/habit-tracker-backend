import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TrackerMembersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(trackerId: string) {
    return this.prisma.trackerMember.findMany({
      where: { trackerId },
      include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async remove(trackerId: string, targetUserId: string) {
    const target = await this.prisma.trackerMember.findUnique({
      where: { trackerId_userId: { trackerId, userId: targetUserId } },
      include: { user: { select: { whatsappNumber: true } } },
    });
    if (!target) throw new NotFoundException('Member not found in this tracker');
    if (target.role === TrackerRole.MASTER) {
      throw new BadRequestException('The tracker master cannot be removed');
    }
    await this.prisma.trackerMember.delete({ where: { id: target.id } });

    if (target.user?.whatsappNumber) {
      this.notificationsService.removeMemberFromTrackerGroup(trackerId, target.user.whatsappNumber).catch(() => {});
    }

    return { success: true };
  }
}
