import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HabitSubtasksService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
    private redis: RedisService,
  ) {}

  async create(userId: string, dto: CreateSubtaskDto) {
    await this.authz.requireHabitMasterAccess(userId, dto.habitId);
    const subtask = await this.prisma.habitSubtask.create({
      data: { habitId: dto.habitId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });

    this.redis.delByPattern('tracker:details:*').catch(() => {});
    this.redis.delByPattern('dashboard:*').catch(() => {});
    return subtask;
  }

  async update(userId: string, subtaskId: string, dto: UpdateSubtaskDto) {
    await this.authz.requireSubtaskMasterAccess(userId, subtaskId);
    const subtask = await this.prisma.habitSubtask.update({ where: { id: subtaskId }, data: dto });

    this.redis.delByPattern('tracker:details:*').catch(() => {});
    this.redis.delByPattern('dashboard:*').catch(() => {});
    return subtask;
  }

  async remove(userId: string, subtaskId: string) {
    await this.authz.requireSubtaskMasterAccess(userId, subtaskId);
    const subtask = await this.prisma.habitSubtask.update({ where: { id: subtaskId }, data: { isActive: false } });

    this.redis.delByPattern('tracker:details:*').catch(() => {});
    this.redis.delByPattern('dashboard:*').catch(() => {});
    return { success: true };
  }
}
