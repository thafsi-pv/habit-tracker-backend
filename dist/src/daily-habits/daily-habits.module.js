"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyHabitsModule = void 0;
const common_1 = require("@nestjs/common");
const daily_habits_controller_1 = require("./daily-habits.controller");
const daily_habits_service_1 = require("./daily-habits.service");
let DailyHabitsModule = class DailyHabitsModule {
};
exports.DailyHabitsModule = DailyHabitsModule;
exports.DailyHabitsModule = DailyHabitsModule = __decorate([
    (0, common_1.Module)({
        controllers: [daily_habits_controller_1.DailyHabitsController],
        providers: [daily_habits_service_1.DailyHabitsService],
    })
], DailyHabitsModule);
//# sourceMappingURL=daily-habits.module.js.map