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
exports.HabitSubtasksController = void 0;
const common_1 = require("@nestjs/common");
const habit_subtasks_service_1 = require("./habit-subtasks.service");
const subtask_dto_1 = require("./dto/subtask.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let HabitSubtasksController = class HabitSubtasksController {
    constructor(subtasksService) {
        this.subtasksService = subtasksService;
    }
    create(user, habitId, dto) {
        return this.subtasksService.create(user.userId, { ...dto, habitId });
    }
    update(user, subtaskId, dto) {
        return this.subtasksService.update(user.userId, subtaskId, dto);
    }
    remove(user, subtaskId) {
        return this.subtasksService.remove(user.userId, subtaskId);
    }
};
exports.HabitSubtasksController = HabitSubtasksController;
__decorate([
    (0, common_1.Post)('habits/:habitId/subtasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('habitId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, subtask_dto_1.CreateSubtaskBodyDto]),
    __metadata("design:returntype", void 0)
], HabitSubtasksController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('subtasks/:subtaskId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('subtaskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, subtask_dto_1.UpdateSubtaskDto]),
    __metadata("design:returntype", void 0)
], HabitSubtasksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('subtasks/:subtaskId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('subtaskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HabitSubtasksController.prototype, "remove", null);
exports.HabitSubtasksController = HabitSubtasksController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [habit_subtasks_service_1.HabitSubtasksService])
], HabitSubtasksController);
//# sourceMappingURL=habit-subtasks.controller.js.map