import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    triggerReport(trackerId: string): Promise<{
        success: boolean;
    }>;
}
