"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const trackers_module_1 = require("./trackers/trackers.module");
const tracker_members_module_1 = require("./tracker-members/tracker-members.module");
const habits_module_1 = require("./habits/habits.module");
const habit_subtasks_module_1 = require("./habit-subtasks/habit-subtasks.module");
const daily_habits_module_1 = require("./daily-habits/daily-habits.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const progress_module_1 = require("./progress/progress.module");
const invitations_module_1 = require("./invitations/invitations.module");
const notifications_module_1 = require("./notifications/notifications.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            trackers_module_1.TrackersModule,
            tracker_members_module_1.TrackerMembersModule,
            habits_module_1.HabitsModule,
            habit_subtasks_module_1.HabitSubtasksModule,
            daily_habits_module_1.DailyHabitsModule,
            dashboard_module_1.DashboardModule,
            progress_module_1.ProgressModule,
            invitations_module_1.InvitationsModule,
            notifications_module_1.NotificationsModule,
            scheduler_module_1.SchedulerModule,
        ],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map