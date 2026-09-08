import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HabitsService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
    private redis: RedisService,
  ) {}

  async create(userId: string, dto: CreateHabitDto) {
    // Confirms the caller is MASTER of dto.trackerId before writing anything —
    // trackerId comes from the client but authorization is never trusted from it.
    await this.authz.requireMaster(userId, dto.trackerId);

    const habit = await this.prisma.habit.create({
      data: {
        trackerId: dto.trackerId,
        name: dto.name,
        icon: dto.icon,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    this.redis.del(`tracker:details:${dto.trackerId}`).catch(() => {});
    this.redis.delByPattern('dashboard:*').catch(() => {});
    return habit;
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    await this.authz.requireHabitMasterAccess(userId, habitId);
    const habit = await this.prisma.habit.update({ where: { id: habitId }, data: dto });

    this.redis.del(`tracker:details:${habit.trackerId}`).catch(() => {});
    this.redis.delByPattern('dashboard:*').catch(() => {});
    return habit;
  }

  /** Soft-delete: deactivate rather than hard-delete so history/streaks stay intact. */
  async remove(userId: string, habitId: string) {
    await this.authz.requireHabitMasterAccess(userId, habitId);
    const habit = await this.prisma.habit.update({ where: { id: habitId }, data: { isActive: false } });

    this.redis.del(`tracker:details:${habit.trackerId}`).catch(() => {});
    this.redis.delByPattern('dashboard:*').catch(() => {});
    return { success: true };
  }
}
