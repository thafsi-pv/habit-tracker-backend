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
exports.HabitSubtasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const authorization_service_1 = require("../common/authorization.service");
let HabitSubtasksService = class HabitSubtasksService {
    constructor(prisma, authz) {
        this.prisma = prisma;
        this.authz = authz;
    }
    async create(userId, dto) {
        await this.authz.requireHabitMasterAccess(userId, dto.habitId);
        return this.prisma.habitSubtask.create({
            data: { habitId: dto.habitId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
        });
    }
    async update(userId, subtaskId, dto) {
        await this.authz.requireSubtaskMasterAccess(userId, subtaskId);
        return this.prisma.habitSubtask.update({ where: { id: subtaskId }, data: dto });
    }
    async remove(userId, subtaskId) {
        await this.authz.requireSubtaskMasterAccess(userId, subtaskId);
        await this.prisma.habitSubtask.update({ where: { id: subtaskId }, data: { isActive: false } });
        return { success: true };
    }
};
exports.HabitSubtasksService = HabitSubtasksService;
exports.HabitSubtasksService = HabitSubtasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        authorization_service_1.AuthorizationService])
], HabitSubtasksService);
//# sourceMappingURL=habit-subtasks.service.js.map