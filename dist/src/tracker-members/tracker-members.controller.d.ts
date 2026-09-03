import { TrackerMembersService } from './tracker-members.service';
export declare class TrackerMembersController {
    private membersService;
    constructor(membersService: TrackerMembersService);
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
    remove(trackerId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
