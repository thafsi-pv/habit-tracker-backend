import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto';

@Injectable()
export class HabitSubtasksService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateSubtaskDto) {
    await this.authz.requireHabitMasterAccess(userId, dto.habitId);
    return this.prisma.habitSubtask.create({
      data: { habitId: dto.habitId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async update(userId: string, subtaskId: string, dto: UpdateSubtaskDto) {
    await this.authz.requireSubtaskMasterAccess(userId, subtaskId);
    return this.prisma.habitSubtask.update({ where: { id: subtaskId }, data: dto });
  }

  async remove(userId: string, subtaskId: string) {
    await this.authz.requireSubtaskMasterAccess(userId, subtaskId);
    await this.prisma.habitSubtask.update({ where: { id: subtaskId }, data: { isActive: false } });
    return { success: true };
  }
}
