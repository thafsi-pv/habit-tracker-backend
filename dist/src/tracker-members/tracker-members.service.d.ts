import { PrismaService } from '../prisma/prisma.service';
export declare class TrackerMembersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(trackerId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.TrackerRole;
        joinedAt: Date;
        userId: string;
        trackerId: string;
    })[]>;
    remove(trackerId: string, targetUserId: string): Promise<{
        success: boolean;
    }>;
}
