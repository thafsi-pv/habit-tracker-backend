import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackerDto, UpdateTrackerDto } from './dto/tracker.dto';
export declare class TrackersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateTrackerDto): Promise<{
        members: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.TrackerRole;
            joinedAt: Date;
            userId: string;
            trackerId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    findAllForUser(userId: string): Promise<{
        myRole: import(".prisma/client").$Enums.TrackerRole;
        _count: {
            members: number;
            habits: number;
        };
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }[]>;
    findOne(trackerId: string): Promise<{
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.TrackerRole;
            joinedAt: Date;
            userId: string;
            trackerId: string;
        })[];
        habits: ({
            subtasks: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                sortOrder: number;
                isActive: boolean;
                habitId: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
            sortOrder: number;
            isActive: boolean;
            trackerId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    update(trackerId: string, dto: UpdateTrackerDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    remove(trackerId: string): Promise<{
        success: boolean;
    }>;
}
