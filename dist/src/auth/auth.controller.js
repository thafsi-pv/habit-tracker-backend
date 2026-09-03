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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const google_auth_guard_1 = require("./google-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
function cookieOptions(maxAgeMs) {
    const isSecure = process.env.COOKIE_SECURE === 'true';
    return {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? 'none' : 'lax',
        maxAge: maxAgeMs,
        path: '/',
    };
}
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    setAuthCookies(res, tokens) {
        res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(15 * 60 * 1000));
        res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000));
    }
    clearAuthCookies(res) {
        res.clearCookie(ACCESS_COOKIE, { path: '/' });
        res.clearCookie(REFRESH_COOKIE, { path: '/' });
    }
    async signup(dto, res) {
        const { user, tokens } = await this.authService.signup(dto);
        this.setAuthCookies(res, tokens);
        return { user };
    }
    async login(dto, res) {
        const { user, tokens } = await this.authService.login(dto);
        this.setAuthCookies(res, tokens);
        return { user };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        if (!refreshToken)
            throw new common_1.UnauthorizedException('No refresh token');
        const { user, tokens } = await this.authService.refresh(refreshToken);
        this.setAuthCookies(res, tokens);
        return { user };
    }
    async logout(req, res) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        await this.authService.logout(refreshToken);
        this.clearAuthCookies(res);
        return { success: true };
    }
    async me(user) {
        return this.authService.me(user.userId);
    }
    async googleAuth() {
    }
    async googleCallback(req, res) {
        const profile = req.user;
        const user = await this.authService.findOrCreateGoogleUser(profile);
        const tokens = await this.authService.issueTokens(user.id, user.email);
        this.setAuthCookies(res, tokens);
        res.redirect(`${process.env.APP_URL}/auth/callback`);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SignupDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map