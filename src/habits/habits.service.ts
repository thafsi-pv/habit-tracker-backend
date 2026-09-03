import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';

@Injectable()
export class HabitsService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
  ) {}

  async create(userId: string, dto: CreateHabitDto) {
    // Confirms the caller is MASTER of dto.trackerId before writing anything —
    // trackerId comes from the client but authorization is never trusted from it.
    await this.authz.requireMaster(userId, dto.trackerId);

    return this.prisma.habit.create({
      data: {
        trackerId: dto.trackerId,
        name: dto.name,
        icon: dto.icon,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    await this.authz.requireHabitMasterAccess(userId, habitId);
    return this.prisma.habit.update({ where: { id: habitId }, data: dto });
  }

  /** Soft-delete: deactivate rather than hard-delete so history/streaks stay intact. */
  async remove(userId: string, habitId: string) {
    await this.authz.requireHabitMasterAccess(userId, habitId);
    await this.prisma.habit.update({ where: { id: habitId }, data: { isActive: false } });
    return { success: true };
  }
}
