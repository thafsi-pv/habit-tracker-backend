import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { ProgressService } from '../progress/progress.service';
export declare class DashboardService {
    private prisma;
    private authz;
    private progressService;
    constructor(prisma: PrismaService, authz: AuthorizationService, progressService: ProgressService);
    getToday(userId: string, trackerId: string, dateStr?: string): Promise<{
        date: string;
        userName: string;
        myProgress: {
            completed: number;
            total: number;
            percent: number;
        };
        myHabits: {
            id: string;
            name: string;
            icon: string | null;
            completed: boolean;
            subtasks: {
                id: string;
                name: string;
                completed: boolean;
            }[];
        }[];
        groupProgress: {
            userId: string;
            name: string;
            avatarUrl: string | null;
            completed: number;
            total: number;
            percent: number;
        }[];
    }>;
}
