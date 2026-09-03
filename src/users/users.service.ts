import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateSettings(userId: string, dto: UpdateUserSettingsDto) {
    return this.prisma.user.update({
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
  }
}
