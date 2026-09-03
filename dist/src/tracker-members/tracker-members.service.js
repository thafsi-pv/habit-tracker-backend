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
exports.TrackerMembersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let TrackerMembersService = class TrackerMembersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(trackerId) {
        return this.prisma.trackerMember.findMany({
            where: { trackerId },
            include: { user: { select: { id: true, name: true, avatarUrl: true, email: true } } },
            orderBy: { joinedAt: 'asc' },
        });
    }
    async remove(trackerId, targetUserId) {
        const target = await this.prisma.trackerMember.findUnique({
            where: { trackerId_userId: { trackerId, userId: targetUserId } },
        });
        if (!target)
            throw new common_1.NotFoundException('Member not found in this tracker');
        if (target.role === client_1.TrackerRole.MASTER) {
            throw new common_1.BadRequestException('The tracker master cannot be removed');
        }
        await this.prisma.trackerMember.delete({ where: { id: target.id } });
        return { success: true };
    }
};
exports.TrackerMembersService = TrackerMembersService;
exports.TrackerMembersService = TrackerMembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrackerMembersService);
//# sourceMappingURL=tracker-members.service.js.map