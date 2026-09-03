import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/invitation.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
declare class AcceptByTokenDto {
    token: string;
}
export declare class InvitationsController {
    private invitationsService;
    constructor(invitationsService: InvitationsService);
    create(user: AuthenticatedUser, trackerId: string, dto: CreateInvitationDto): Promise<{
        id: string;
        email: string;
        expiresAt: Date;
    }>;
    findAll(trackerId: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        expiresAt: Date;
        acceptedAt: Date | null;
    }[]>;
    remove(trackerId: string, invitationId: string): Promise<{
        success: boolean;
    }>;
    findPending(user: AuthenticatedUser): Promise<({
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
    accept(user: AuthenticatedUser, invitationId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.TrackerRole;
        joinedAt: Date;
        userId: string;
        trackerId: string;
    }>;
    acceptByToken(user: AuthenticatedUser, dto: AcceptByTokenDto): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.TrackerRole;
        joinedAt: Date;
        userId: string;
        trackerId: string;
    }>;
}
export {};
