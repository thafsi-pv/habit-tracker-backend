import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async updateSettings(userId: string, dto: UpdateUserSettingsDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        timezone: true,
        notificationTime: true,
        notificationsEnabled: true,
        whatsappNumber: true,
      },
    });

    if (dto.whatsappNumber) {
      const memberships = await this.prisma.trackerMember.findMany({
        where: { userId },
        select: { trackerId: true },
      });
      for (const m of memberships) {
        this.notificationsService.syncMemberToTrackerGroup(m.trackerId, dto.whatsappNumber).catch(() => {});
      }
    }

    return updated;
  }
}
