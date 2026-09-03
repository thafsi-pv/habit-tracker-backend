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
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let WhatsAppController = class WhatsAppController {
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    getStatus(user) {
        return this.whatsappService.getStatus(user.userId);
    }
    async connect(user) {
        await this.whatsappService.connect(user.userId);
        return { started: true };
    }
    async disconnect(user) {
        await this.whatsappService.disconnect(user.userId);
        return { success: true };
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WhatsAppController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('connect'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "connect", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "disconnect", null);
exports.WhatsAppController = WhatsAppController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('whatsapp'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map