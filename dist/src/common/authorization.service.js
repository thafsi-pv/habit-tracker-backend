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
exports.AuthorizationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthorizationService = class AuthorizationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMembership(userId, trackerId) {
        const membership = await this.prisma.trackerMember.findUnique({
            where: { trackerId_userId: { trackerId, userId } },
        });
        if (!membership) {
            throw new common_1.ForbiddenException('You are not a member of this tracker');
        }
        return membership;
    }
    async requireMaster(userId, trackerId) {
        const membership = await this.getMembership(userId, trackerId);
        if (membership.role !== client_1.TrackerRole.MASTER) {
            throw new common_1.ForbiddenException('Only the tracker master can perform this action');
        }
        return membership;
    }
    async requireHabitAccess(userId, habitId) {
        const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
        if (!habit)
            throw new common_1.NotFoundException('Habit not found');
        const membership = await this.getMembership(userId, habit.trackerId);
        return { habit, membership };
    }
    async requireHabitMasterAccess(userId, habitId) {
        const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
        if (!habit)
            throw new common_1.NotFoundException('Habit not found');
        const membership = await this.requireMaster(userId, habit.trackerId);
        return { habit, membership };
    }
    async requireSubtaskAccess(userId, subtaskId) {
        const subtask = await this.prisma.habitSubtask.findUnique({
            where: { id: subtaskId },
            include: { habit: true },
        });
        if (!subtask)
            throw new common_1.NotFoundException('Subtask not found');
        const membership = await this.getMembership(userId, subtask.habit.trackerId);
        return { subtask, membership };
    }
    async requireSubtaskMasterAccess(userId, subtaskId) {
        const subtask = await this.prisma.habitSubtask.findUnique({
            where: { id: subtaskId },
            include: { habit: true },
        });
        if (!subtask)
            throw new common_1.NotFoundException('Subtask not found');
        const membership = await this.requireMaster(userId, subtask.habit.trackerId);
        return { subtask, membership };
    }
};
exports.AuthorizationService = AuthorizationService;
exports.AuthorizationService = AuthorizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthorizationService);
//# sourceMappingURL=authorization.service.js.map