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
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_provider_interface_1 = require("./whatsapp-provider.interface");
let WhatsAppService = class WhatsAppService {
    constructor(provider) {
        this.provider = provider;
    }
    async connect(userId) {
        await this.provider.connect(userId);
    }
    async disconnect(userId) {
        await this.provider.disconnect(userId);
    }
    async getStatus(userId) {
        return this.provider.getStatus(userId);
    }
    async sendToUser(userId, message) {
        const status = await this.getStatus(userId);
        if (status.status !== 'CONNECTED' || !status.phoneNumber) {
            return { success: false, error: 'WhatsApp is not connected for this user' };
        }
        return this.provider.sendText(userId, status.phoneNumber, message);
    }
    async sendToNumber(senderUserId, recipientNumber, message) {
        const status = await this.getStatus(senderUserId);
        if (status.status !== 'CONNECTED' || !status.phoneNumber) {
            return { success: false, error: 'Sender WhatsApp is not connected' };
        }
        const cleanNumber = recipientNumber.replace(/\D/g, '');
        if (!cleanNumber) {
            return { success: false, error: 'Invalid recipient number' };
        }
        return this.provider.sendText(senderUserId, cleanNumber, message);
    }
    async sendImageToNumber(senderUserId, recipientNumber, image, caption) {
        const status = await this.getStatus(senderUserId);
        if (status.status !== 'CONNECTED' || !status.phoneNumber) {
            return { success: false, error: 'Sender WhatsApp is not connected' };
        }
        const cleanNumber = recipientNumber.replace(/\D/g, '');
        if (!cleanNumber) {
            return { success: false, error: 'Invalid recipient number' };
        }
        return this.provider.sendImage(senderUserId, cleanNumber, image, caption);
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(whatsapp_provider_interface_1.WHATSAPP_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map