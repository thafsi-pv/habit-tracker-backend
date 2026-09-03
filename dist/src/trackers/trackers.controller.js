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
exports.TrackersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const trackers_service_1 = require("./trackers.service");
const tracker_dto_1 = require("./dto/tracker.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const tracker_member_guard_1 = require("../common/guards/tracker-member.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TrackersController = class TrackersController {
    constructor(trackersService) {
        this.trackersService = trackersService;
    }
    create(user, dto) {
        return this.trackersService.create(user.userId, dto);
    }
    findAll(user) {
        return this.trackersService.findAllForUser(user.userId);
    }
    findOne(trackerId) {
        return this.trackersService.findOne(trackerId);
    }
    update(trackerId, dto) {
        return this.trackersService.update(trackerId, dto);
    }
    remove(trackerId) {
        return this.trackersService.remove(trackerId);
    }
};
exports.TrackersController = TrackersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tracker_dto_1.CreateTrackerDto]),
    __metadata("design:returntype", void 0)
], TrackersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrackersController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(tracker_member_guard_1.TrackerMemberGuard),
    (0, common_1.Get)(':trackerId'),
    __param(0, (0, common_1.Param)('trackerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrackersController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.TrackerRole.MASTER),
    (0, common_1.UseGuards)(tracker_member_guard_1.TrackerMemberGuard),
    (0, common_1.Patch)(':trackerId'),
    __param(0, (0, common_1.Param)('trackerId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tracker_dto_1.UpdateTrackerDto]),
    __metadata("design:returntype", void 0)
], TrackersController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.TrackerRole.MASTER),
    (0, common_1.UseGuards)(tracker_member_guard_1.TrackerMemberGuard),
    (0, common_1.Delete)(':trackerId'),
    __param(0, (0, common_1.Param)('trackerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrackersController.prototype, "remove", null);
exports.TrackersController = TrackersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('trackers'),
    __metadata("design:paramtypes", [trackers_service_1.TrackersService])
], TrackersController);
//# sourceMappingURL=trackers.controller.js.map