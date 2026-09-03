import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Single source of truth for "is this authenticated user allowed to touch
 * this resource" checks. Every mutating endpoint MUST go through here (or
 * TrackerMemberGuard, which delegates here) rather than trusting any userId
 * / role / trackerId sent from the client.
 */
@Injectable()
export class AuthorizationService {
  constructor(private prisma: PrismaService) {}

  /** Returns the caller's membership in a tracker, or throws. */
  async getMembership(userId: string, trackerId: string) {
    const membership = await this.prisma.trackerMember.findUnique({
      where: { trackerId_userId: { trackerId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this tracker');
    }
    return membership;
  }

  async requireMaster(userId: string, trackerId: string) {
    const membership = await this.getMembership(userId, trackerId);
    if (membership.role !== TrackerRole.MASTER) {
      throw new ForbiddenException('Only the tracker master can perform this action');
    }
    return membership;
  }

  /** Resolves the tracker a habit belongs to and confirms caller membership. */
  async requireHabitAccess(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new NotFoundException('Habit not found');
    const membership = await this.getMembership(userId, habit.trackerId);
    return { habit, membership };
  }

  async requireHabitMasterAccess(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new NotFoundException('Habit not found');
    const membership = await this.requireMaster(userId, habit.trackerId);
    return { habit, membership };
  }

  async requireSubtaskAccess(userId: string, subtaskId: string) {
    const subtask = await this.prisma.habitSubtask.findUnique({
      where: { id: subtaskId },
      include: { habit: true },
    });
    if (!subtask) throw new NotFoundException('Subtask not found');
    const membership = await this.getMembership(userId, subtask.habit.trackerId);
    return { subtask, membership };
  }

  async requireSubtaskMasterAccess(userId: string, subtaskId: string) {
    const subtask = await this.prisma.habitSubtask.findUnique({
      where: { id: subtaskId },
      include: { habit: true },
    });
    if (!subtask) throw new NotFoundException('Subtask not found');
    const membership = await this.requireMaster(userId, subtask.habit.trackerId);
    return { subtask, membership };
  }
}
