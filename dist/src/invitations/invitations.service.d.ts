import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { CreateInvitationDto } from './dto/invitation.dto';
export declare class InvitationsService {
    private prisma;
    private emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    create(trackerId: string, invitedById: string, dto: CreateInvitationDto): Promise<{
        id: string;
        email: string;
        expiresAt: Date;
    }>;
    findAllForTracker(trackerId: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        expiresAt: Date;
        acceptedAt: Date | null;
    }[]>;
    remove(trackerId: string, invitationId: string): Promise<{
        success: boolean;
    }>;
    findPendingForUser(userId: string): Promise<({
        tracker: {
            id: string;
            name: string;
        };
        invitedBy: {
            name: string;
        };
    } & {
        id: string;
        email: string;
        createdAt: Date;
        trackerId: string;
        tokenHash: string;
        expiresAt: Date;
        invitedById: string;
        acceptedAt: Date | null;
    })[]>;
    private assertAcceptable;
    accept(userId: string, invitationId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.TrackerRole;
        joinedAt: Date;
        userId: string;
        trackerId: string;
    }>;
    acceptByToken(userId: string, token: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.TrackerRole;
        joinedAt: Date;
        userId: string;
        trackerId: string;
    }>;
}
