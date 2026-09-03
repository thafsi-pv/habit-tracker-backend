import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { ProgressService } from '../progress/progress.service';
import { parseCalendarDate, todayInTimezone } from '../common/date.util';
import { buildCompletedSets } from '../progress/habit-completion.util';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private authz: AuthorizationService,
    private progressService: ProgressService,
  ) {}

  async getToday(userId: string, trackerId: string, dateStr?: string) {
    await this.authz.getMembership(userId, trackerId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const date = dateStr ?? todayInTimezone(user.timezone);
    const dbDate = parseCalendarDate(date);

    const habits = await this.prisma.habit.findMany({
      where: { trackerId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { subtasks: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });

    const [habitCompletions, subtaskCompletions] = await Promise.all([
      this.prisma.dailyHabit.findMany({ where: { date: dbDate, habit: { trackerId }, userId } }),
      this.prisma.dailySubtaskCompletion.findMany({
        where: { date: dbDate, subtask: { habit: { trackerId } }, userId },
      }),
    ]);

    const { habitCompletedSet, subtaskCompletedSet } = buildCompletedSets(
      habitCompletions,
      subtaskCompletions,
      userId,
    );

    // The caller's own habits are the interactive ones — shape includes
    // per-subtask completion so the frontend can render checkboxes directly.
    const myHabits = habits.map((h) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      completed: habitCompletedSet.has(h.id),
      subtasks: h.subtasks.map((s) => ({
        id: s.id,
        name: s.name,
        completed: subtaskCompletedSet.has(s.id),
      })),
    }));

    const totalHabits = habits.length;
    const completedHabits = myHabits.filter((h) =>
      h.subtasks.length === 0 ? h.completed : h.subtasks.every((s) => s.completed),
    ).length;

    const groupProgress = await this.progressService.getDailyProgress(userId, trackerId, date);

    return {
      date,
      userName: user.name,
      myProgress: {
        completed: completedHabits,
        total: totalHabits,
        percent: totalHabits === 0 ? 0 : Math.round((completedHabits / totalHabits) * 100),
      },
      myHabits,
      groupProgress: groupProgress.members,
    };
  }
}
