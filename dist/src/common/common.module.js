"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const authorization_service_1 = require("./authorization.service");
const tracker_member_guard_1 = require("./guards/tracker-member.guard");
const health_controller_1 = require("./health.controller");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [health_controller_1.HealthController],
        providers: [authorization_service_1.AuthorizationService, tracker_member_guard_1.TrackerMemberGuard],
        exports: [authorization_service_1.AuthorizationService, tracker_member_guard_1.TrackerMemberGuard],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map