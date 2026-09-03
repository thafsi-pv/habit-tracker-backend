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
exports.DailyHabitsController = void 0;
const common_1 = require("@nestjs/common");
const daily_habits_service_1 = require("./daily-habits.service");
const daily_habit_dto_1 = require("./dto/daily-habit.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let DailyHabitsController = class DailyHabitsController {
    constructor(dailyHabitsService) {
        this.dailyHabitsService = dailyHabitsService;
    }
    getForTrackerAndDate(user, trackerId, date) {
        return this.dailyHabitsService.getForTrackerAndDate(user.userId, trackerId, date);
    }
    setHabit(user, habitId, dto) {
        return this.dailyHabitsService.setHabitCompletion(user.userId, habitId, dto);
    }
    setSubtask(user, subtaskId, dto) {
        return this.dailyHabitsService.setSubtaskCompletion(user.userId, subtaskId, dto);
    }
};
exports.DailyHabitsController = DailyHabitsController;
__decorate([
    (0, common_1.Get)('daily-habits'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('trackerId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DailyHabitsController.prototype, "getForTrackerAndDate", null);
__decorate([
    (0, common_1.Patch)('daily-habits/habit/:habitId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('habitId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, daily_habit_dto_1.SetCompletionDto]),
    __metadata("design:returntype", void 0)
], DailyHabitsController.prototype, "setHabit", null);
__decorate([
    (0, common_1.Patch)('daily-habits/subtask/:subtaskId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('subtaskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, daily_habit_dto_1.SetCompletionDto]),
    __metadata("design:returntype", void 0)
], DailyHabitsController.prototype, "setSubtask", null);
exports.DailyHabitsController = DailyHabitsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [daily_habits_service_1.DailyHabitsService])
], DailyHabitsController);
//# sourceMappingURL=daily-habits.controller.js.map