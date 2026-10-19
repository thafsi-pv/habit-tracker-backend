import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ProgressService } from '../progress/progress.service';
import { ReportCardService } from './report-card.service';
import { todayInTimezone } from '../common/date.util';

interface SubtaskReport {
  name: string;
  completed: boolean;
}

interface HabitReport {
  name: string;
  icon: string | null;
  completed: boolean;
  streak: number;
  subtasks: SubtaskReport[];
}

interface MemberReport {
  name: string;
  isMaster: boolean;
  habits: HabitReport[];
  completed: number;
  total: number;
  percent: number;
}

function formatHabitLine(h: HabitReport): string[] {
  const icon = h.icon ?? '•';
  const status = h.completed ? '✅' : '❌';
  const streak = h.streak > 0 ? ` 🔥 ${h.streak} day streak` : '';
  const lines = [`  ${icon} ${h.name}  ${status}${streak}`];
  if (h.subtasks && h.subtasks.length > 0) {
    for (const sub of h.subtasks) {
      lines.push(`     └─ ${sub.completed ? '✅' : '❌'} ${sub.name}`);
    }
  }
  return lines;
}

function formatMemberSection(member: MemberReport, isCurrentUser: boolean): string[] {
  const label = isCurrentUser ? '📋 *Your Activity*' : `👤 *${member.name}*${member.isMaster ? ' 👑' : ''}`;
  const lines: string[] = [
    label,
    '─'.repeat(20),
  ];

  for (const h of member.habits) {
    lines.push(...formatHabitLine(h));
    lines.push('');  // newline between each task
  }

  const bar = buildProgressBar(member.percent);
  lines.push(`  📊 ${member.completed}/${member.total} completed  ${bar}  ${member.percent}%`);

  if (member.percent === 100) {
    lines.push('  🎉 Perfect day!');
  }

  return lines;
}

function buildProgressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

function buildReportMessage(params: {
  trackerName: string;
  userName: string;
  dateLabel: string;
  currentUser: MemberReport;
  otherMembers: MemberReport[];
}): string {
  const { trackerName, userName, dateLabel, currentUser, otherMembers } = params;

  const allMembers = [currentUser, ...otherMembers];
  const totalCompleted = allMembers.reduce((s, m) => s + m.completed, 0);
  const totalHabits = allMembers.reduce((s, m) => s + m.total, 0);
  const overallPercent = totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;

  const lines: string[] = [
    '🌙 *Daily Habit Report*',
    '',
    `📌 *${trackerName}*`,
    `📅 ${dateLabel}`,
    '',
    `Hey ${userName} 👋`,
    '',
    // Current user section
    ...formatMemberSection(currentUser, true),
    '',
  ];

  // Other members sections
  for (const member of otherMembers) {
    lines.push(...formatMemberSection(member, false));
    lines.push('');
  }

  // Overall summary
  lines.push('━'.repeat(20));
  lines.push('📈 *Overall Group Summary*');
  lines.push('');
  for (const m of allMembers) {
    const bar = buildProgressBar(m.percent);
    lines.push(`  ${m.isMaster ? '👑' : '👤'} ${m.name}: ${m.completed}/${m.total}  ${bar}  ${m.percent}%`);
  }
  lines.push('');
  lines.push(`  🏆 Group Total: ${totalCompleted}/${totalHabits} (${overallPercent}%)`);

  if (overallPercent === 100) {
    lines.push('  🎉🎉 Everyone nailed it today! 🎉🎉');
  } else if (overallPercent >= 75) {
    lines.push('  💪 Great teamwork!');
  } else {
    lines.push('  🔥 Let\'s push harder tomorrow!');
  }

  return lines.join('\n');
}

function buildGroupReportMessage(params: {
  trackerName: string;
  dateLabel: string;
  members: MemberReport[];
}): string {
  const { trackerName, dateLabel, members } = params;
  const totalCompleted = members.reduce((s, m) => s + m.completed, 0);
  const totalHabits = members.reduce((s, m) => s + m.total, 0);
  const overallPercent = totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;

  const lines: string[] = [
    '🌙 *Daily Habit Report*',
    `📌 *${trackerName}*`,
    `📅 ${dateLabel}`,
    '',
    `📊 *Group Progress:* ${totalCompleted}/${totalHabits} completed (${overallPercent}%)`,
    buildProgressBar(overallPercent),
    '',
    '👥 *Member Breakdown:*',
  ];

  for (const m of members) {
    const bar = buildProgressBar(m.percent);
    const badge = m.percent === 100 ? '🌟' : m.percent >= 50 ? '⚡' : '⏳';
    const role = m.isMaster ? ' 👑' : '';
    lines.push(`${badge} *${m.name}*${role}: ${m.completed}/${m.total} (${m.percent}%)`);
    lines.push(`   ${bar}`);
  }

  lines.push('');
  if (overallPercent === 100) {
    lines.push('🎉🎉 *Outstanding! Everyone completed 100% today!* 🎉🎉');
  } else if (overallPercent >= 75) {
    lines.push('💪 *Great teamwork! Keep up the momentum!*');
  } else {
    lines.push("🔥 *Good effort today! Let's push higher tomorrow!*");
  }

  return lines.join('\n');
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
    private dashboardService: DashboardService,
    private progressService: ProgressService,
    private reportCardService: ReportCardService,
  ) {}

  /**
   * Resolves or auto-creates the WhatsApp group for a given tracker.
   * Adds all aligned members who have a WhatsApp number to the group.
   */
  async ensureTrackerWhatsAppGroup(trackerId: string): Promise<{ groupId: string; senderId: string } | null> {
    const tracker = await this.prisma.tracker.findUnique({
      where: { id: trackerId },
      include: {
        owner: true,
        members: { include: { user: true } },
      },
    });
    if (!tracker) return null;

    // Use a central admin user for WhatsApp connection, or fallback to tracker owner
    const adminUser = await this.prisma.user.findUnique({ where: { email: 'thafsi@example.com' } });
    let senderId = adminUser?.id;
    let status = senderId ? await this.whatsappService.getStatus(senderId) : null;

    if (status?.status !== 'CONNECTED') {
      const ownerStatus = await this.whatsappService.getStatus(tracker.ownerId);
      if (ownerStatus.status === 'CONNECTED') {
        senderId = tracker.ownerId;
        status = ownerStatus;
      }
    }

    if (!senderId || status?.status !== 'CONNECTED') {
      this.logger.warn(`WhatsApp sender is not connected for tracker ${trackerId}`);
      return null;
    }

    // Collect aligned participants (members with whatsappNumber)
    const memberNumbers = tracker.members
      .map((m) => m.user.whatsappNumber)
      .filter((num): num is string => typeof num === 'string' && num.trim().length > 0);

    // If tracker already has a whatsappGroupId, sync any members and return
    if (tracker.whatsappGroupId) {
      if (memberNumbers.length > 0) {
        this.whatsappService.addParticipantsToGroup(senderId, tracker.whatsappGroupId, memberNumbers).catch((err) => {
          this.logger.warn(`Could not sync participants to group ${tracker.whatsappGroupId}: ${err?.message}`);
        });
      }
      return { groupId: tracker.whatsappGroupId, senderId };
    }

    // If tracker does not have a WhatsApp group yet, create one
    if (memberNumbers.length === 0) {
      this.logger.warn(`Cannot create WhatsApp group for tracker ${trackerId}: No members have a valid WhatsApp number`);
      return null;
    }

    const groupName = `${tracker.name} (Habits)`;
    this.logger.log(`Creating WhatsApp group "${groupName}" for tracker ${trackerId} with members: ${memberNumbers.join(', ')}`);

    const result = await this.whatsappService.createGroup(senderId, groupName, memberNumbers);
    if (!result.success || !result.groupId) {
      this.logger.error(`Failed to create WhatsApp group for tracker ${trackerId}: ${result.error}`);
      return null;
    }

    await this.prisma.tracker.update({
      where: { id: trackerId },
      data: {
        whatsappGroupId: result.groupId,
        whatsappGroupInviteLink: result.inviteLink ?? null,
      },
    });

    this.logger.log(`Created WhatsApp group ${result.groupId} for tracker ${trackerId}`);
    return { groupId: result.groupId, senderId };
  }

  /**
   * Sends the consolidated daily group report card to the tracker's WhatsApp group.
   * Does NOT send to individual personal numbers.
   */
  async sendTrackerReports(trackerId: string): Promise<void> {
    const tracker = await this.prisma.tracker.findUnique({
      where: { id: trackerId },
      include: {
        owner: true,
        members: { include: { user: true } },
      },
    });
    if (!tracker) return;

    const groupInfo = await this.ensureTrackerWhatsAppGroup(trackerId);
    if (!groupInfo) {
      this.logger.warn(`Cannot send tracker report: WhatsApp group not ready for tracker ${trackerId}`);
      return;
    }

    const masterId = tracker.ownerId;
    const masterTimezone = tracker.owner.timezone;
    const today = todayInTimezone(masterTimezone);
    const dateLabel = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });

    // Pre-fetch all members' data
    const memberReports: MemberReport[] = [];
    for (const member of tracker.members) {
      try {
        const dashboard = await this.dashboardService.getToday(member.user.id, trackerId, today);
        const monthly = await this.progressService.getMonthlyProgress(member.user.id, trackerId);

        memberReports.push({
          name: member.user.name,
          isMaster: member.user.id === masterId,
          habits: dashboard.myHabits.map((h) => {
            const streak = monthly.habits.find((mh) => mh.habitId === h.id)?.currentStreak ?? 0;
            return {
              name: h.name,
              icon: h.icon,
              completed: h.subtasks.length === 0 ? h.completed : h.subtasks.every((s) => s.completed),
              streak,
              subtasks: (h.subtasks || []).map((s) => ({
                name: s.name,
                completed: s.completed,
              })),
            };
          }),
          completed: dashboard.myProgress.completed,
          total: dashboard.myProgress.total,
          percent: dashboard.myProgress.percent,
        });
      } catch (err) {
        this.logger.error(`Error fetching data for member ${member.user.id}`, err as Error);
      }
    }

    if (memberReports.length === 0) return;

    // Sort: highest completion first
    memberReports.sort((a, b) => b.percent - a.percent);

    const caption = buildGroupReportMessage({
      trackerName: tracker.name,
      dateLabel,
      members: memberReports,
    });

    try {
      const image = await this.reportCardService.render({
        trackerName: tracker.name,
        userName: tracker.name,
        dateLabel,
        currentUser: { ...memberReports[0], isCurrentUser: false },
        otherMembers: memberReports.slice(1).map((m) => ({ ...m, isCurrentUser: false })),
      });

      const log = await this.prisma.notificationLog.create({
        data: {
          userId: tracker.ownerId,
          trackerId,
          type: NotificationType.DAILY_REPORT,
          channel: NotificationChannel.WHATSAPP,
          status: 'PENDING',
          message: caption,
        },
      });

      const result = await this.whatsappService.sendImageToGroup(
        groupInfo.senderId,
        groupInfo.groupId,
        image,
        caption,
      );

      await this.prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: result.success ? new Date() : null,
          error: result.error,
        },
      });

      if (!result.success) {
        this.logger.warn(`Daily report image to group ${groupInfo.groupId} failed: ${result.error}`);
      }
    } catch (err) {
      this.logger.error(`Error sending group report image for tracker ${trackerId}`, err as Error);
    }
  }

  /**
   * Broadcasts activity completion directly to the tracker's WhatsApp group.
   * Does NOT send to individual personal numbers.
   */
  async broadcastActivityCompletion(
    trackerId: string,
    activityName: string,
    completedByUserId: string,
    completedByUserName: string,
  ): Promise<void> {
    const tracker = await this.prisma.tracker.findUnique({
      where: { id: trackerId },
    });
    if (!tracker || !tracker.notifyOnActivityUpdate) return;

    const groupInfo = await this.ensureTrackerWhatsAppGroup(trackerId);
    if (!groupInfo) {
      this.logger.warn(`Cannot broadcast activity completion: WhatsApp group not ready for tracker ${trackerId}`);
      return;
    }

    const message = `✅ *${completedByUserName}* just completed *${activityName}* in *${tracker.name}*!`;

    try {
      const result = await this.whatsappService.sendToGroup(
        groupInfo.senderId,
        groupInfo.groupId,
        message,
      );

      await this.prisma.notificationLog.create({
        data: {
          userId: completedByUserId,
          trackerId,
          type: NotificationType.ACTIVITY_COMPLETION,
          channel: NotificationChannel.WHATSAPP,
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: result.success ? new Date() : null,
          message,
          error: result.error,
        },
      });

      if (!result.success) {
        this.logger.warn(`Broadcast to WhatsApp group failed for tracker ${trackerId}: ${result.error}`);
      }
    } catch (err) {
      this.logger.error(`Error broadcasting activity to group for tracker ${trackerId}`, err as Error);
    }
  }

  /**
   * Adds a member to the tracker's WhatsApp group when they join or update their number.
   */
  async syncMemberToTrackerGroup(trackerId: string, userWhatsappNumber?: string | null): Promise<void> {
    if (!userWhatsappNumber) return;
    const tracker = await this.prisma.tracker.findUnique({
      where: { id: trackerId },
      select: { whatsappGroupId: true, ownerId: true },
    });
    if (!tracker?.whatsappGroupId) return;

    const adminUser = await this.prisma.user.findUnique({ where: { email: 'thafsi@example.com' } });
    const senderId = adminUser?.id ?? tracker.ownerId;
    await this.whatsappService.addParticipantsToGroup(senderId, tracker.whatsappGroupId, [userWhatsappNumber]).catch((err) => {
      this.logger.warn(`Could not add member to group ${tracker.whatsappGroupId}: ${err?.message}`);
    });
  }

  /**
   * Removes a member from the tracker's WhatsApp group when they leave or are removed.
   */
  async removeMemberFromTrackerGroup(trackerId: string, userWhatsappNumber?: string | null): Promise<void> {
    if (!userWhatsappNumber) return;
    const tracker = await this.prisma.tracker.findUnique({
      where: { id: trackerId },
      select: { whatsappGroupId: true, ownerId: true },
    });
    if (!tracker?.whatsappGroupId) return;

    const adminUser = await this.prisma.user.findUnique({ where: { email: 'thafsi@example.com' } });
    const senderId = adminUser?.id ?? tracker.ownerId;
    await this.whatsappService.removeParticipantsFromGroup(senderId, tracker.whatsappGroupId, [userWhatsappNumber]).catch((err) => {
      this.logger.warn(`Could not remove member from group ${tracker.whatsappGroupId}: ${err?.message}`);
    });
  }
}
