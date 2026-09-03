import { Injectable } from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackerDto, UpdateTrackerDto } from './dto/tracker.dto';

@Injectable()
export class TrackersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTrackerDto) {
    return this.prisma.tracker.create({
      data: {
        name: dto.name,
        ownerId: userId,
        members: {
          create: { userId, role: TrackerRole.MASTER },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
    });
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.trackerMember.findMany({
      where: { userId },
      include: {
        tracker: {
          include: {
            _count: { select: { members: true, habits: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({ ...m.tracker, myRole: m.role }));
  }

  // Membership already verified by TrackerMemberGuard before this runs.
  async findOne(trackerId: string) {
    return this.prisma.tracker.findUniqueOrThrow({
      where: { id: trackerId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
        },
        habits: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: { subtasks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
  }

  async update(trackerId: string, dto: UpdateTrackerDto) {
    return this.prisma.tracker.update({ where: { id: trackerId }, data: { name: dto.name } });
  }

  async remove(trackerId: string) {
    await this.prisma.tracker.delete({ where: { id: trackerId } });
    return { success: true };
  }
}
