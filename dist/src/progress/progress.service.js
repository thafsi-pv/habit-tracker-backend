"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const authorization_service_1 = require("../common/authorization.service");
const date_util_1 = require("../common/date.util");
const habit_completion_util_1 = require("./habit-completion.util");
let ProgressService = class ProgressService {
    constructor(prisma, authz) {
        this.prisma = prisma;
        this.authz = authz;
    }
    async getActiveHabitsWithSubtasks(trackerId) {
        return this.prisma.habit.findMany({
            where: { trackerId, isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: { subtasks: { where: { isActive: true } } },
        });
    }
    async getMembers(trackerId) {
        return this.prisma.trackerMember.findMany({
            where: { trackerId },
            include: { user: { select: { id: true, name: true, avatarUrl: true, timezone: true } } },
        });
    }
    async getDailyProgress(userId, trackerId, dateStr) {
        await this.authz.getMembership(userId, trackerId);
        const date = (0, date_util_1.parseCalendarDate)(dateStr);
        const [habits, members, habitCompletions, subtaskCompletions] = await Promise.all([
            this.getActiveHabitsWithSubtasks(trackerId),
            this.getMembers(trackerId),
            this.prisma.dailyHabit.findMany({ where: { date, habit: { trackerId } } }),
            this.prisma.dailySubtaskCompletion.findMany({ where: { date, subtask: { habit: { trackerId } } } }),
        ]);
        const total = habits.length;
        const results = members.map((m) => {
            const { habitCompletedSet, subtaskCompletedSet } = (0, habit_completion_util_1.buildCompletedSets)(habitCompletions, subtaskCompletions, m.userId);
            const completed = habits.filter((h) => (0, habit_completion_util_1.isHabitCompleteForUser)(h, habitCompletedSet, subtaskCompletedSet)).length;
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
    async getWeeklyProgress(userId, trackerId) {
        const membership = await this.authz.getMembership(userId, trackerId);
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const today = (0, date_util_1.todayInTimezone)(user.timezone);
        const days = [];
        for (let i = 6; i >= 0; i--)
            days.push((0, date_util_1.addDays)(today, -i));
        const [habits, members] = await Promise.all([
            this.getActiveHabitsWithSubtasks(trackerId),
            this.getMembers(trackerId),
        ]);
        const total = habits.length;
        const from = (0, date_util_1.parseCalendarDate)(days[0]);
        const to = (0, date_util_1.parseCalendarDate)(days[days.length - 1]);
        const [habitCompletions, subtaskCompletions] = await Promise.all([
            this.prisma.dailyHabit.findMany({ where: { habit: { trackerId }, date: { gte: from, lte: to } } }),
            this.prisma.dailySubtaskCompletion.findMany({
                where: { subtask: { habit: { trackerId } }, date: { gte: from, lte: to } },
            }),
        ]);
        const byMember = members.map((m) => {
            const dayResults = days.map((dayStr) => {
                const dayDate = (0, date_util_1.parseCalendarDate)(dayStr).toISOString().slice(0, 10);
                const hc = habitCompletions.filter((c) => c.date.toISOString().slice(0, 10) === dayDate);
                const sc = subtaskCompletions.filter((c) => c.date.toISOString().slice(0, 10) === dayDate);
                const { habitCompletedSet, subtaskCompletedSet } = (0, habit_completion_util_1.buildCompletedSets)(hc, sc, m.userId);
                const completed = habits.filter((h) => (0, habit_completion_util_1.isHabitCompleteForUser)(h, habitCompletedSet, subtaskCompletedSet)).length;
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
    async getMonthlyProgress(userId, trackerId) {
        await this.authz.getMembership(userId, trackerId);
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const today = (0, date_util_1.todayInTimezone)(user.timezone);
        const windowStart = (0, date_util_1.addDays)(today, -29);
        const habits = await this.getActiveHabitsWithSubtasks(trackerId);
        const from = (0, date_util_1.parseCalendarDate)(windowStart);
        const to = (0, date_util_1.parseCalendarDate)(today);
        const [habitCompletions, subtaskCompletions] = await Promise.all([
            this.prisma.dailyHabit.findMany({
                where: { userId, habit: { trackerId }, date: { gte: from, lte: to } },
            }),
            this.prisma.dailySubtaskCompletion.findMany({
                where: { userId, subtask: { habit: { trackerId } }, date: { gte: from, lte: to } },
            }),
        ]);
        const days = [];
        for (let i = 0; i <= 29; i++)
            days.push((0, date_util_1.addDays)(windowStart, i));
        const habitStats = habits.map((habit) => {
            const completedByDay = days.map((dayStr) => {
                const dayDate = (0, date_util_1.parseCalendarDate)(dayStr).toISOString().slice(0, 10);
                const hc = habitCompletions.filter((c) => c.date.toISOString().slice(0, 10) === dayDate);
                const sc = subtaskCompletions.filter((c) => c.date.toISOString().slice(0, 10) === dayDate);
                const { habitCompletedSet, subtaskCompletedSet } = (0, habit_completion_util_1.buildCompletedSets)(hc, sc, userId);
                return (0, habit_completion_util_1.isHabitCompleteForUser)(habit, habitCompletedSet, subtaskCompletedSet);
            });
            const completedDays = completedByDay.filter(Boolean).length;
            const completionRate = Math.round((completedDays / days.length) * 100);
            let currentStreak = 0;
            for (let i = completedByDay.length - 1; i >= 0; i--) {
                if (completedByDay[i])
                    currentStreak++;
                else
                    break;
            }
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
        const overallRate = habitStats.length === 0
            ? 0
            : Math.round(habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habitStats.length);
        return { windowStart, windowEnd: today, habits: habitStats, overallCompletionRate: overallRate };
    }
};
exports.ProgressService = ProgressService;
exports.ProgressService = ProgressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        authorization_service_1.AuthorizationService])
], ProgressService);
//# sourceMappingURL=progress.service.js.map