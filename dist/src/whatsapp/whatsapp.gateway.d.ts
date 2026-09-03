import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WhatsAppStatus } from './whatsapp-provider.interface';
export declare class WhatsAppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    server: Server;
    private readonly logger;
    constructor(jwt: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(): void;
    emitStatus(userId: string, status: WhatsAppStatus): void;
}
