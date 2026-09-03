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
exports.InvitationsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const invitations_service_1 = require("./invitations.service");
const invitation_dto_1 = require("./dto/invitation.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const tracker_member_guard_1 = require("../common/guards/tracker-member.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
class AcceptByTokenDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptByTokenDto.prototype, "token", void 0);
let InvitationsController = class InvitationsController {
    constructor(invitationsService) {
        this.invitationsService = invitationsService;
    }
    create(user, trackerId, dto) {
        return this.invitationsService.create(trackerId, user.userId, dto);
    }
    findAll(trackerId) {
        return this.invitationsService.findAllForTracker(trackerId);
    }
    remove(trackerId, invitationId) {
        return this.invitationsService.remove(trackerId, invitationId);
    }
    findPending(user) {
        return this.invitationsService.findPendingForUser(user.userId);
    }
    accept(user, invitationId) {
        return this.invitationsService.accept(user.userId, invitationId);
    }
    acceptByToken(user, dto) {
        return this.invitationsService.acceptByToken(user.userId, dto.token);
    }
};
exports.InvitationsController = InvitationsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.TrackerRole.MASTER),
    (0, common_1.UseGuards)(tracker_member_guard_1.TrackerMemberGuard),
    (0, common_1.Post)('trackers/:trackerId/invitations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('trackerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, invitation_dto_1.CreateInvitationDto]),
    __metadata("design:returntype", void 0)
], InvitationsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.TrackerRole.MASTER),
    (0, common_1.UseGuards)(tracker_member_guard_1.TrackerMemberGuard),
    (0, common_1.Get)('trackers/:trackerId/invitations'),
    __param(0, (0, common_1.Param)('trackerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvitationsController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.TrackerRole.MASTER),
    (0, common_1.UseGuards)(tracker_member_guard_1.TrackerMemberGuard),
    (0, common_1.Delete)('trackers/:trackerId/invitations/:invitationId'),
    __param(0, (0, common_1.Param)('trackerId')),
    __param(1, (0, common_1.Param)('invitationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InvitationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('invitations/pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InvitationsController.prototype, "findPending", null);
__decorate([
    (0, common_1.Post)('invitations/:invitationId/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('invitationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvitationsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('invitations/accept-by-token'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AcceptByTokenDto]),
    __metadata("design:returntype", void 0)
], InvitationsController.prototype, "acceptByToken", null);
exports.InvitationsController = InvitationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [invitations_service_1.InvitationsService])
], InvitationsController);
//# sourceMappingURL=invitations.controller.js.map