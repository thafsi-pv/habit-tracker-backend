import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
export declare class ProgressService {
    private prisma;
    private authz;
    constructor(prisma: PrismaService, authz: AuthorizationService);
    private getActiveHabitsWithSubtasks;
    private getMembers;
    getDailyProgress(userId: string, trackerId: string, dateStr: string): Promise<{
        date: string;
        members: {
            userId: string;
            name: string;
            avatarUrl: string | null;
            completed: number;
            total: number;
            percent: number;
        }[];
    }>;
    getWeeklyProgress(userId: string, trackerId: string): Promise<{
        days: string[];
        members: {
            userId: string;
            name: string;
            days: {
                date: string;
                completed: number;
                total: number;
                percent: number;
            }[];
        }[];
    }>;
    getMonthlyProgress(userId: string, trackerId: string): Promise<{
        windowStart: string;
        windowEnd: string;
        habits: {
            habitId: string;
            name: string;
            icon: string | null;
            completionRate: number;
            completedDays: number;
            totalDays: number;
            currentStreak: number;
            bestStreak: number;
        }[];
        overallCompletionRate: number;
    }>;
}
