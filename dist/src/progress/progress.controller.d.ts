import { ProgressService } from './progress.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class ProgressController {
    private progressService;
    constructor(progressService: ProgressService);
    daily(user: AuthenticatedUser, trackerId: string, date: string): Promise<{
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
    weekly(user: AuthenticatedUser, trackerId: string): Promise<{
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
    monthly(user: AuthenticatedUser, trackerId: string): Promise<{
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
