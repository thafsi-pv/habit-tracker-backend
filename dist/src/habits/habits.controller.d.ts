import { HabitsService } from './habits.service';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class HabitsController {
    private habitsService;
    constructor(habitsService: HabitsService);
    create(user: AuthenticatedUser, dto: CreateHabitDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        sortOrder: number;
        isActive: boolean;
        trackerId: string;
    }>;
    update(user: AuthenticatedUser, habitId: string, dto: UpdateHabitDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        sortOrder: number;
        isActive: boolean;
        trackerId: string;
    }>;
    remove(user: AuthenticatedUser, habitId: string): Promise<{
        success: boolean;
    }>;
}
