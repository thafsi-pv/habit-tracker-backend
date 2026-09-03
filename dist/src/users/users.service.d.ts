import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    updateSettings(userId: string, dto: UpdateUserSettingsDto): Promise<{
        id: string;
        timezone: string;
        whatsappNumber: string | null;
        notificationTime: string | null;
        notificationsEnabled: boolean;
    }>;
}
