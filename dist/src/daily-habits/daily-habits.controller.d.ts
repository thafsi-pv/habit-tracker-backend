import { DailyHabitsService } from './daily-habits.service';
import { SetCompletionDto } from './dto/daily-habit.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class DailyHabitsController {
    private dailyHabitsService;
    constructor(dailyHabitsService: DailyHabitsService);
    getForTrackerAndDate(user: AuthenticatedUser, trackerId: string, date: string): Promise<{
        habitCompletions: {
            id: string;
            userId: string;
            habitId: string;
            date: Date;
            completed: boolean;
            completedAt: Date | null;
        }[];
        subtaskCompletions: {
            id: string;
            userId: string;
            subtaskId: string;
            date: Date;
            completed: boolean;
            completedAt: Date | null;
        }[];
    }>;
    setHabit(user: AuthenticatedUser, habitId: string, dto: SetCompletionDto): Promise<{
        id: string;
        userId: string;
        habitId: string;
        date: Date;
        completed: boolean;
        completedAt: Date | null;
    }>;
    setSubtask(user: AuthenticatedUser, subtaskId: string, dto: SetCompletionDto): Promise<{
        id: string;
        userId: string;
        subtaskId: string;
        date: Date;
        completed: boolean;
        completedAt: Date | null;
    }>;
}
