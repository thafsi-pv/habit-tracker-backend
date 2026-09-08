import { Injectable } from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackerDto, UpdateTrackerDto } from './dto/tracker.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TrackersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(userId: string, dto: CreateTrackerDto) {
    const result = await this.prisma.tracker.create({
      data: {
        name: dto.name,
        ownerId: userId,
        members: {
          create: { userId, role: TrackerRole.MASTER },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
    });

    this.redis.del(`trackers:user:${userId}`).catch(() => {});
    return result;
  }

  async findAllForUser(userId: string) {
    const cacheKey = `trackers:user:${userId}`;
    return this.redis.wrap(cacheKey, async () => {
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
    });
  }

  // Membership already verified by TrackerMemberGuard before this runs.
  async findOne(trackerId: string) {
    const cacheKey = `tracker:details:${trackerId}`;
    return this.redis.wrap(cacheKey, async () => {
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
    });
  }

  async update(trackerId: string, dto: UpdateTrackerDto) {
    const result = await this.prisma.tracker.update({ 
      where: { id: trackerId }, 
      data: { 
        name: dto.name,
        ...(dto.notifyOnActivityUpdate !== undefined && { notifyOnActivityUpdate: dto.notifyOnActivityUpdate })
      } 
    });

    this.redis.del(`tracker:details:${trackerId}`).catch(() => {});
    this.redis.delByPattern('trackers:user:*').catch(() => {});
    return result;
  }

  async remove(trackerId: string) {
    await this.prisma.tracker.delete({ where: { id: trackerId } });
    this.redis.del(`tracker:details:${trackerId}`).catch(() => {});
    this.redis.delByPattern('trackers:user:*').catch(() => {});
    this.redis.delByPattern('dashboard:*').catch(() => {});
    return { success: true };
  }
}
