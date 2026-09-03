import { HabitSubtasksService } from './habit-subtasks.service';
import { CreateSubtaskBodyDto, UpdateSubtaskDto } from './dto/subtask.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class HabitSubtasksController {
    private subtasksService;
    constructor(subtasksService: HabitSubtasksService);
    create(user: AuthenticatedUser, habitId: string, dto: CreateSubtaskBodyDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        isActive: boolean;
        habitId: string;
    }>;
    update(user: AuthenticatedUser, subtaskId: string, dto: UpdateSubtaskDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        isActive: boolean;
        habitId: string;
    }>;
    remove(user: AuthenticatedUser, subtaskId: string): Promise<{
        success: boolean;
    }>;
}
