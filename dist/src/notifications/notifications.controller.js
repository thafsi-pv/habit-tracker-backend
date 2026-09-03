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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("./notifications.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const tracker_member_guard_1 = require("../common/guards/tracker-member.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async triggerReport(trackerId) {
        await this.notificationsService.sendTrackerReports(trackerId);
        return { success: true };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.TrackerRole.MASTER),
    (0, common_1.UseGuards)(tracker_member_guard_1.TrackerMemberGuard),
    (0, common_1.Post)(':trackerId/trigger-report'),
    __param(0, (0, common_1.Param)('trackerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "triggerReport", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('trackers'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map