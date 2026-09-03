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
exports.HabitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const authorization_service_1 = require("../common/authorization.service");
let HabitsService = class HabitsService {
    constructor(prisma, authz) {
        this.prisma = prisma;
        this.authz = authz;
    }
    async create(userId, dto) {
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
    async update(userId, habitId, dto) {
        await this.authz.requireHabitMasterAccess(userId, habitId);
        return this.prisma.habit.update({ where: { id: habitId }, data: dto });
    }
    async remove(userId, habitId) {
        await this.authz.requireHabitMasterAccess(userId, habitId);
        await this.prisma.habit.update({ where: { id: habitId }, data: { isActive: false } });
        return { success: true };
    }
};
exports.HabitsService = HabitsService;
exports.HabitsService = HabitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        authorization_service_1.AuthorizationService])
], HabitsService);
//# sourceMappingURL=habits.service.js.map