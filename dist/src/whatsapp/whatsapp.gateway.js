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
var WhatsAppGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
let WhatsAppGateway = WhatsAppGateway_1 = class WhatsAppGateway {
    constructor(jwt) {
        this.jwt = jwt;
        this.logger = new common_1.Logger(WhatsAppGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ??
                client.handshake.headers.cookie
                    ?.split(';')
                    .find((c) => c.trim().startsWith('access_token='))
                    ?.split('=')[1];
            if (!token)
                throw new Error('No token');
            const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET });
            client.join(`user:${payload.sub}`);
        }
        catch {
            this.logger.warn(`Unauthenticated WhatsApp socket connection rejected`);
            client.disconnect(true);
        }
    }
    handleDisconnect() {
    }
    emitStatus(userId, status) {
        this.server?.to(`user:${userId}`).emit('status', status);
    }
};
exports.WhatsAppGateway = WhatsAppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WhatsAppGateway.prototype, "server", void 0);
exports.WhatsAppGateway = WhatsAppGateway = WhatsAppGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({ namespace: '/whatsapp', cors: { origin: process.env.APP_URL, credentials: true } }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], WhatsAppGateway);
//# sourceMappingURL=whatsapp.gateway.js.map