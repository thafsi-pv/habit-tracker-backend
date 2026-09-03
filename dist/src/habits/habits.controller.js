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
exports.HabitsController = void 0;
const common_1 = require("@nestjs/common");
const habits_service_1 = require("./habits.service");
const habit_dto_1 = require("./dto/habit.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let HabitsController = class HabitsController {
    constructor(habitsService) {
        this.habitsService = habitsService;
    }
    create(user, dto) {
        return this.habitsService.create(user.userId, dto);
    }
    update(user, habitId, dto) {
        return this.habitsService.update(user.userId, habitId, dto);
    }
    remove(user, habitId) {
        return this.habitsService.remove(user.userId, habitId);
    }
};
exports.HabitsController = HabitsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, habit_dto_1.CreateHabitDto]),
    __metadata("design:returntype", void 0)
], HabitsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':habitId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('habitId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, habit_dto_1.UpdateHabitDto]),
    __metadata("design:returntype", void 0)
], HabitsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':habitId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('habitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HabitsController.prototype, "remove", null);
exports.HabitsController = HabitsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('habits'),
    __metadata("design:paramtypes", [habits_service_1.HabitsService])
], HabitsController);
//# sourceMappingURL=habits.controller.js.map