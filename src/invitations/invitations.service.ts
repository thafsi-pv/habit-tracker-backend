import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TrackerRole } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { CreateInvitationDto } from './dto/invitation.dto';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Caller's MASTER membership is already verified by TrackerMemberGuard.
  async create(trackerId: string, invitedById: string, dto: CreateInvitationDto) {
    const email = dto.email.toLowerCase().trim();

    const tracker = await this.prisma.tracker.findUniqueOrThrow({ where: { id: trackerId } });

    const existingMember = await this.prisma.trackerMember.findFirst({
      where: { trackerId, user: { email } },
    });
    if (existingMember) {
      throw new ConflictException('This person is already a member of the tracker');
    }

    const existingPending = await this.prisma.invitation.findFirst({
      where: { trackerId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingPending) {
      throw new ConflictException('An invitation for this email is already pending');
    }

    const token = generateToken();
    const invitation = await this.prisma.invitation.create({
      data: {
        trackerId,
        email,
        invitedById,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      },
    });

    const appUrl = process.env.APP_URL ?? '';
    await this.emailService.send(
      email,
      `You've been invited to join "${tracker.name}"`,
      `Sign up or log in with this email address (${email}) and accept the invitation from your dashboard.\n` +
        `${appUrl}/invitations/accept?token=${token}`,
    );

    return { id: invitation.id, email: invitation.email, expiresAt: invitation.expiresAt };
  }

  // Caller's MASTER membership already verified by TrackerMemberGuard.
  async findAllForTracker(trackerId: string) {
    return this.prisma.invitation.findMany({
      where: { trackerId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, expiresAt: true, acceptedAt: true, createdAt: true },
    });
  }

  async remove(trackerId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.trackerId !== trackerId) {
      throw new NotFoundException('Invitation not found');
    }
    await this.prisma.invitation.delete({ where: { id: invitationId } });
    return { success: true };
  }

  /** Invitations addressed to the currently authenticated user's email. */
  async findPendingForUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.invitation.findMany({
      where: { email: user.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
      include: {
        tracker: { select: { id: true, name: true } },
        invitedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async assertAcceptable(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation) throw new NotFoundException('Invitation not found');

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    // The single most important check in this flow: the authenticated
    // user's email must match the invited email exactly.
    if (invitation.email !== user.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }
    if (invitation.acceptedAt) {
      throw new ConflictException('This invitation has already been accepted');
    }
    if (invitation.expiresAt < new Date()) {
      throw new GoneException('This invitation has expired');
    }
    return invitation;
  }

  async accept(userId: string, invitationId: string) {
    const invitation = await this.assertAcceptable(invitationId, userId);

    return this.prisma.$transaction(async (tx) => {
      const existingMember = await tx.trackerMember.findUnique({
        where: { trackerId_userId: { trackerId: invitation.trackerId, userId } },
      });
      if (existingMember) {
        throw new ConflictException('You are already a member of this tracker');
      }

      const member = await tx.trackerMember.create({
        data: { trackerId: invitation.trackerId, userId, role: TrackerRole.MEMBER },
      });
      await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
      return member;
    });
  }

  /** Accept via the emailed token instead of an authenticated invitationId lookup. */
  async acceptByToken(userId: string, token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!invitation) throw new BadRequestException('Invalid invitation link');
    return this.accept(userId, invitation.id);
  }
}
