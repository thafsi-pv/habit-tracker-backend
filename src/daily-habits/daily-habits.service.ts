import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { SetCompletionDto } from './dto/daily-habit.dto';
import { parseCalendarDate } from '../common/date.util';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DailyHabitsService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Sets the CURRENT user's completion for a habit on a date. userId is
   * always taken from the JWT-derived caller, never from the request body —
   * this is the guarantee that "user cannot edit another user's completion".
   */
  async setHabitCompletion(userId: string, habitId: string, dto: SetCompletionDto) {
    await this.authz.requireHabitAccess(userId, habitId); // any member may mark their own
    const date = parseCalendarDate(dto.date);
    const result = await this.prisma.dailyHabit.upsert({
      where: { habitId_userId_date: { habitId, userId, date } },
      create: { habitId, userId, date, completed: dto.completed, completedAt: dto.completed ? new Date() : null },
      update: { completed: dto.completed, completedAt: dto.completed ? new Date() : null },
    });

    if (dto.completed) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const habit = await this.prisma.habit.findUnique({ where: { id: habitId }, include: { tracker: true } });
      if (user && habit && habit.tracker.notifyOnActivityUpdate) {
        // Broadcast in the background to avoid blocking the HTTP response
        this.notificationsService.broadcastActivityCompletion(habit.trackerId, habit.name, userId, user.name).catch(() => {});
      }
    }

    return result;
  }

  async setSubtaskCompletion(userId: string, subtaskId: string, dto: SetCompletionDto) {
    await this.authz.requireSubtaskAccess(userId, subtaskId);
    const date = parseCalendarDate(dto.date);
    const result = await this.prisma.dailySubtaskCompletion.upsert({
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

    if (dto.completed) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const subtask = await this.prisma.habitSubtask.findUnique({ 
        where: { id: subtaskId }, 
        include: { habit: { include: { tracker: true } } } 
      });
      if (user && subtask && subtask.habit.tracker.notifyOnActivityUpdate) {
        const activityName = `${subtask.habit.name} - ${subtask.name}`;
        this.notificationsService.broadcastActivityCompletion(subtask.habit.trackerId, activityName, userId, user.name).catch(() => {});
      }
    }

    return result;
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
