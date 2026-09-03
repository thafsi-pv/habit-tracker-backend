import { PrismaService } from '../prisma/prisma.service';
export declare class AuthorizationService {
    private prisma;
    constructor(prisma: PrismaService);
    getMembership(userId: string, trackerId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.TrackerRole;
        joinedAt: Date;
        userId: string;
        trackerId: string;
    }>;
    requireMaster(userId: string, trackerId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.TrackerRole;
        joinedAt: Date;
        userId: string;
        trackerId: string;
    }>;
    requireHabitAccess(userId: string, habitId: string): Promise<{
        habit: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
            sortOrder: number;
            isActive: boolean;
            trackerId: string;
        };
        membership: {
            id: string;
            role: import(".prisma/client").$Enums.TrackerRole;
            joinedAt: Date;
            userId: string;
            trackerId: string;
        };
    }>;
    requireHabitMasterAccess(userId: string, habitId: string): Promise<{
        habit: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
            sortOrder: number;
            isActive: boolean;
            trackerId: string;
        };
        membership: {
            id: string;
            role: import(".prisma/client").$Enums.TrackerRole;
            joinedAt: Date;
            userId: string;
            trackerId: string;
        };
    }>;
    requireSubtaskAccess(userId: string, subtaskId: string): Promise<{
        subtask: {
            habit: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                sortOrder: number;
                isActive: boolean;
                trackerId: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            isActive: boolean;
            habitId: string;
        };
        membership: {
            id: string;
            role: import(".prisma/client").$Enums.TrackerRole;
            joinedAt: Date;
            userId: string;
            trackerId: string;
        };
    }>;
    requireSubtaskMasterAccess(userId: string, subtaskId: string): Promise<{
        subtask: {
            habit: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                sortOrder: number;
                isActive: boolean;
                trackerId: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            isActive: boolean;
            habitId: string;
        };
        membership: {
            id: string;
            role: import(".prisma/client").$Enums.TrackerRole;
            joinedAt: Date;
            userId: string;
            trackerId: string;
        };
    }>;
}
