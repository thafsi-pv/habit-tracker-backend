import { UsersService } from './users.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    updateSettings(user: AuthenticatedUser, dto: UpdateUserSettingsDto): Promise<{
        id: string;
        timezone: string;
        whatsappNumber: string | null;
        notificationTime: string | null;
        notificationsEnabled: boolean;
    }>;
}
