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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
function toPublicUser(user) {
    const { id, name, email, avatarUrl, timezone, notificationsEnabled, notificationTime, whatsappNumber } = user;
    return { id, name, email, avatarUrl, timezone, notificationsEnabled, notificationTime, whatsappNumber };
}
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async signup(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const passwordHash = await argon2.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
                timezone: dto.timezone ?? 'UTC',
            },
        });
        const tokens = await this.issueTokens(user.id, user.email);
        return { user: toPublicUser(user), tokens };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const valid = await argon2.verify(user.passwordHash, dto.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const tokens = await this.issueTokens(user.id, user.email);
        return { user: toPublicUser(user), tokens };
    }
    async findOrCreateGoogleUser(profile) {
        let user = await this.prisma.user.findUnique({ where: { googleId: profile.googleId } });
        if (user)
            return toPublicUser(user);
        user = await this.prisma.user.findUnique({ where: { email: profile.email } });
        if (user) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.googleId, avatarUrl: user.avatarUrl ?? profile.avatarUrl },
            });
            return toPublicUser(user);
        }
        user = await this.prisma.user.create({
            data: {
                googleId: profile.googleId,
                email: profile.email,
                name: profile.name,
                avatarUrl: profile.avatarUrl,
            },
        });
        return toPublicUser(user);
    }
    async issueTokens(userId, email) {
        const accessToken = await this.jwt.signAsync({ sub: userId, email, type: 'access' }, { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_ACCESS_TTL ?? '15m' });
        const refreshRecord = await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: '',
                expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
            },
        });
        const refreshToken = await this.jwt.signAsync({ sub: userId, jti: refreshRecord.id, type: 'refresh' }, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_TTL ?? '30d' });
        await this.prisma.refreshToken.update({
            where: { id: refreshRecord.id },
            data: { tokenHash: hashToken(refreshToken) },
        });
        return { accessToken, refreshToken };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (payload.type !== 'refresh')
            throw new common_1.UnauthorizedException('Invalid token type');
        const record = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
        if (!record || record.revokedAt || record.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token expired or revoked');
        }
        if (record.tokenHash !== hashToken(refreshToken)) {
            await this.prisma.refreshToken.update({
                where: { id: record.id },
                data: { revokedAt: new Date() },
            });
            throw new common_1.UnauthorizedException('Refresh token mismatch');
        }
        const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        await this.prisma.refreshToken.update({
            where: { id: record.id },
            data: { revokedAt: new Date() },
        });
        const tokens = await this.issueTokens(user.id, user.email);
        return { user: toPublicUser(user), tokens };
    }
    async logout(refreshToken) {
        if (!refreshToken)
            return;
        try {
            const payload = await this.jwt.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
            await this.prisma.refreshToken.updateMany({
                where: { id: payload.jti, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        catch {
        }
    }
    async me(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        return toPublicUser(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map