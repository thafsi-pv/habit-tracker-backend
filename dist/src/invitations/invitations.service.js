"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("./email.service");
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
let InvitationsService = class InvitationsService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async create(trackerId, invitedById, dto) {
        const email = dto.email.toLowerCase().trim();
        const tracker = await this.prisma.tracker.findUniqueOrThrow({ where: { id: trackerId } });
        const existingMember = await this.prisma.trackerMember.findFirst({
            where: { trackerId, user: { email } },
        });
        if (existingMember) {
            throw new common_1.ConflictException('This person is already a member of the tracker');
        }
        const existingPending = await this.prisma.invitation.findFirst({
            where: { trackerId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
        });
        if (existingPending) {
            throw new common_1.ConflictException('An invitation for this email is already pending');
        }
        const token = generateToken();
        const invitation = await this.prisma.invitation.create({
            data: {
                trackerId,
                email,
                invitedById,
                tokenHash: hashToken(token),
                expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
            },
        });
        const appUrl = process.env.APP_URL ?? '';
        await this.emailService.send(email, `You've been invited to join "${tracker.name}"`, `Sign up or log in with this email address (${email}) and accept the invitation from your dashboard.\n` +
            `${appUrl}/invitations/accept?token=${token}`);
        return { id: invitation.id, email: invitation.email, expiresAt: invitation.expiresAt };
    }
    async findAllForTracker(trackerId) {
        return this.prisma.invitation.findMany({
            where: { trackerId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, expiresAt: true, acceptedAt: true, createdAt: true },
        });
    }
    async remove(trackerId, invitationId) {
        const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
        if (!invitation || invitation.trackerId !== trackerId) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        await this.prisma.invitation.delete({ where: { id: invitationId } });
        return { success: true };
    }
    async findPendingForUser(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        return this.prisma.invitation.findMany({
            where: { email: user.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
            include: {
                tracker: { select: { id: true, name: true } },
                invitedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async assertAcceptable(invitationId, userId) {
        const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
        if (!invitation)
            throw new common_1.NotFoundException('Invitation not found');
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        if (invitation.email !== user.email.toLowerCase()) {
            throw new common_1.ForbiddenException('This invitation was sent to a different email address');
        }
        if (invitation.acceptedAt) {
            throw new common_1.ConflictException('This invitation has already been accepted');
        }
        if (invitation.expiresAt < new Date()) {
            throw new common_1.GoneException('This invitation has expired');
        }
        return invitation;
    }
    async accept(userId, invitationId) {
        const invitation = await this.assertAcceptable(invitationId, userId);
        return this.prisma.$transaction(async (tx) => {
            const existingMember = await tx.trackerMember.findUnique({
                where: { trackerId_userId: { trackerId: invitation.trackerId, userId } },
            });
            if (existingMember) {
                throw new common_1.ConflictException('You are already a member of this tracker');
            }
            const member = await tx.trackerMember.create({
                data: { trackerId: invitation.trackerId, userId, role: client_1.TrackerRole.MEMBER },
            });
            await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
            return member;
        });
    }
    async acceptByToken(userId, token) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { tokenHash: hashToken(token) },
        });
        if (!invitation)
            throw new common_1.BadRequestException('Invalid invitation link');
        return this.accept(userId, invitation.id);
    }
};
exports.InvitationsService = InvitationsService;
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map