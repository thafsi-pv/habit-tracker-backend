import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto';
export declare class HabitSubtasksService {
    private prisma;
    private authz;
    constructor(prisma: PrismaService, authz: AuthorizationService);
    create(userId: string, dto: CreateSubtaskDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        isActive: boolean;
        habitId: string;
    }>;
    update(userId: string, subtaskId: string, dto: UpdateSubtaskDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        isActive: boolean;
        habitId: string;
    }>;
    remove(userId: string, subtaskId: string): Promise<{
        success: boolean;
    }>;
}
