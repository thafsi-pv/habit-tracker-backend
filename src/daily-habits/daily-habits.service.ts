import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { SetCompletionDto } from './dto/daily-habit.dto';
import { parseCalendarDate } from '../common/date.util';

@Injectable()
export class DailyHabitsService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
  ) {}

  /**
   * Sets the CURRENT user's completion for a habit on a date. userId is
   * always taken from the JWT-derived caller, never from the request body —
   * this is the guarantee that "user cannot edit another user's completion".
   */
  async setHabitCompletion(userId: string, habitId: string, dto: SetCompletionDto) {
    await this.authz.requireHabitAccess(userId, habitId); // any member may mark their own
    const date = parseCalendarDate(dto.date);
    return this.prisma.dailyHabit.upsert({
      where: { habitId_userId_date: { habitId, userId, date } },
      create: { habitId, userId, date, completed: dto.completed, completedAt: dto.completed ? new Date() : null },
      update: { completed: dto.completed, completedAt: dto.completed ? new Date() : null },
    });
  }

  async setSubtaskCompletion(userId: string, subtaskId: string, dto: SetCompletionDto) {
    await this.authz.requireSubtaskAccess(userId, subtaskId);
    const date = parseCalendarDate(dto.date);
    return this.prisma.dailySubtaskCompletion.upsert({
      where: { subtaskId_userId_date: { subtaskId, userId, date } },
      create: {
        subtaskId,
        userId,
        date,
        completed: dto.completed,
        completedAt: dto.completed ? new Date() : null,
      },
      update: { completed: dto.completed, completedAt: dto.completed ? new Date() : null },
    });
  }

  /** Read model: every tracker member can see everyone's completions for a given date. */
  async getForTrackerAndDate(userId: string, trackerId: string, dateStr: string) {
    await this.authz.getMembership(userId, trackerId);
    const date = parseCalendarDate(dateStr);

    const [habitCompletions, subtaskCompletions] = await Promise.all([
      this.prisma.dailyHabit.findMany({
        where: { date, habit: { trackerId } },
      }),
      this.prisma.dailySubtaskCompletion.findMany({
        where: { date, subtask: { habit: { trackerId } } },
      }),
    ]);

    return { habitCompletions, subtaskCompletions };
  }
}
