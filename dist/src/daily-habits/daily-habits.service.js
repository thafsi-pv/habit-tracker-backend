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
exports.DailyHabitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const authorization_service_1 = require("../common/authorization.service");
const date_util_1 = require("../common/date.util");
let DailyHabitsService = class DailyHabitsService {
    constructor(prisma, authz) {
        this.prisma = prisma;
        this.authz = authz;
    }
    async setHabitCompletion(userId, habitId, dto) {
        await this.authz.requireHabitAccess(userId, habitId);
        const date = (0, date_util_1.parseCalendarDate)(dto.date);
        return this.prisma.dailyHabit.upsert({
            where: { habitId_userId_date: { habitId, userId, date } },
            create: { habitId, userId, date, completed: dto.completed, completedAt: dto.completed ? new Date() : null },
            update: { completed: dto.completed, completedAt: dto.completed ? new Date() : null },
        });
    }
    async setSubtaskCompletion(userId, subtaskId, dto) {
        await this.authz.requireSubtaskAccess(userId, subtaskId);
        const date = (0, date_util_1.parseCalendarDate)(dto.date);
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
    async getForTrackerAndDate(userId, trackerId, dateStr) {
        await this.authz.getMembership(userId, trackerId);
        const date = (0, date_util_1.parseCalendarDate)(dateStr);
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
};
exports.DailyHabitsService = DailyHabitsService;
exports.DailyHabitsService = DailyHabitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        authorization_service_1.AuthorizationService])
], DailyHabitsService);
//# sourceMappingURL=daily-habits.service.js.map