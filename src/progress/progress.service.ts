import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { addDays, parseCalendarDate, todayInTimezone } from '../common/date.util';
import { buildCompletedSets, isHabitCompleteForUser } from './habit-completion.util';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
  ) {}

  private async getActiveHabitsWithSubtasks(trackerId: string) {
    return this.prisma.habit.findMany({
      where: { trackerId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { subtasks: { where: { isActive: true } } },
    });
  }

  private async getMembers(trackerId: string) {
    return this.prisma.trackerMember.findMany({
      where: { trackerId },
      include: { user: { select: { id: true, name: true, avatarUrl: true, timezone: true } } },
    });
  }

  /** Percent complete for every member of the tracker on one calendar date. */
  async getDailyProgress(userId: string, trackerId: string, dateStr: string) {
    await this.authz.getMembership(userId, trackerId);
    const date = parseCalendarDate(dateStr);
    const [habits, members, habitCompletions, subtaskCompletions] = await Promise.all([
      this.getActiveHabitsWithSubtasks(trackerId),
      this.getMembers(trackerId),
      this.prisma.dailyHabit.findMany({ where: { date, habit: { trackerId } } }),
      this.prisma.dailySubtaskCompletion.findMany({ where: { date, subtask: { habit: { trackerId } } } }),
    ]);

    const total = habits.length;
    const results = members.map((m) => {
      const { habitCompletedSet, subtaskCompletedSet } = buildCompletedSets(
        habitCompletions,
        subtaskCompletions,
        m.userId,
      );
      const completed = habits.filter((h) => isHabitCompleteForUser(h, habitCompletedSet, subtaskCompletedSet)).length;
      return {
        userId: m.userId,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        completed,
        total,
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      };
    });

    return { date: dateStr, members: results };
  }

  /** Last 7 days (ending today, in the requesting user's timezone) percent per member. */
  async getWeeklyProgress(userId: string, trackerId: string) {
    const membership = await this.authz.getMembership(userId, trackerId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = todayInTimezone(user.timezone);

    const days: string[] = [];
    for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));

    const [habits, members] = await Promise.all([
      this.getActiveHabitsWithSubtasks(trackerId),
      this.getMembers(trackerId),
    ]);
    const total = habits.length;

    const from = parseCalendarDate(days[0]);
    const to = parseCalendarDate(days[days.length - 1]);
    const [habitCompletions, subtaskCompletions] = await Promise.all([
      this.prisma.dailyHabit.findMany({ where: { habit: { trackerId }, date: { gte: from, lte: to } } }),
      this.prisma.dailySubtaskCompletion.findMany({
        where: { subtask: { habit: { trackerId } }, date: { gte: from, lte: to } },
      }),
    ]);

    const byMember = members.map((m) => {
      const dayResults = days.map((dayStr) => {
        const dayDate = parseCalendarDate(dayStr).toISOString().slice(0, 10);
        const hc = habitCompletions.filter((c) => c.date.toISOString().slice(0, 10) === dayDate);
        const sc = subtaskCompletions.filter((c) => c.date.toISOString().slice(0, 10) === dayDate);
        const { habitCompletedSet, subtaskCompletedSet } = buildCompletedSets(hc, sc, m.userId);
        const completed = habits.filter((h) => isHabitCompleteForUser(h, habitCompletedSet, subtaskCompletedSet)).length;
        return {
          date: dayStr,
          completed,
          total,
          percent: total === 0 ? 0 : Math.round((completed / total) * 100),
        };
      });
      return { userId: m.userId, name: m.user.name, days: dayResults };
    });

    void membership;
    return { days, members: byMember };
  }

  /**
   * Per-habit stats for the REQUESTING user only (completion rate, days
   * completed, current/best streak) over the last 30 days, plus overall
   * tracker average for the same window.
   */
  async getMonthlyProgress(userId: string, trackerId: string) {
    await this.authz.getMembership(userId, trackerId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = todayInTimezone(user.timezone);
    const windowStart = addDays(today, -29);

    const habits = await this.getActiveHabitsWithSubtasks(trackerId);
    const from = parseCalendarDate(windowStart);
    const to = parseCalendarDate(today);

    const [habitCompletions, subtaskCompletions] = await Promise.all([
      this.prisma.dailyHabit.findMany({
        where: { userId, habit: { trackerId }, date: { gte: from, lte: to } },
      }),
      this.prisma.dailySubtaskCompletion.findMany({
        where: { userId, subtask: { habit: { trackerId } }, date: { gte: from, lte: to } },
      }),
    ]);

    const days: string[] = [];
    for (let i = 0; i <= 29; i++) days.push(addDays(windowStart, i));

    const habitStats = habits.map((habit) => {
      const completedByDay = days.map((dayStr) => {
        const dayDate = parseCalendarDate(dayStr).toISOString().slice(0, 10);
        const hc = habitCompletions.filter((c) => c.date.toISOString().slice(0, 10) === dayDate);
        const sc = subtaskCompletions.filter((c) => c.date.toISOString().slice(0, 10) === dayDate);
        const { habitCompletedSet, subtaskCompletedSet } = buildCompletedSets(hc, sc, userId);
        return isHabitCompleteForUser(habit, habitCompletedSet, subtaskCompletedSet);
      });

      const completedDays = completedByDay.filter(Boolean).length;
      const completionRate = Math.round((completedDays / days.length) * 100);

      // Current streak: consecutive completed days walking back from today.
      let currentStreak = 0;
      for (let i = completedByDay.length - 1; i >= 0; i--) {
        if (completedByDay[i]) currentStreak++;
        else break;
      }

      // Best streak: longest run of consecutive true values in the window.
      let bestStreak = 0;
      let run = 0;
      for (const done of completedByDay) {
        run = done ? run + 1 : 0;
        bestStreak = Math.max(bestStreak, run);
      }

      return {
        habitId: habit.id,
        name: habit.name,
        icon: habit.icon,
        completionRate,
        completedDays,
        totalDays: days.length,
        currentStreak,
        bestStreak,
      };
    });

    const overallRate =
      habitStats.length === 0
        ? 0
        : Math.round(habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habitStats.length);

    return { windowStart, windowEnd: today, habits: habitStats, overallCompletionRate: overallRate };
  }
}
