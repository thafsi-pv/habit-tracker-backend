import { WhatsAppService } from './whatsapp.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class WhatsAppController {
    private whatsappService;
    constructor(whatsappService: WhatsAppService);
    getStatus(user: AuthenticatedUser): Promise<import("./whatsapp-provider.interface").WhatsAppStatus>;
    connect(user: AuthenticatedUser): Promise<{
        started: boolean;
    }>;
    disconnect(user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
}
