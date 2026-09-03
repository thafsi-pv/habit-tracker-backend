import { DashboardService } from './dashboard.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    today(user: AuthenticatedUser, trackerId: string, date?: string): Promise<{
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
