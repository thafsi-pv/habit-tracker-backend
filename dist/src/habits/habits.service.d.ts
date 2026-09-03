import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationService } from '../common/authorization.service';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';
export declare class HabitsService {
    private prisma;
    private authz;
    constructor(prisma: PrismaService, authz: AuthorizationService);
    create(userId: string, dto: CreateHabitDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        sortOrder: number;
        isActive: boolean;
        trackerId: string;
    }>;
    update(userId: string, habitId: string, dto: UpdateHabitDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
        sortOrder: number;
        isActive: boolean;
        trackerId: string;
    }>;
    remove(userId: string, habitId: string): Promise<{
        success: boolean;
    }>;
}
