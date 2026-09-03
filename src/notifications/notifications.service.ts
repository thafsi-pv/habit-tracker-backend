import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ProgressService } from '../progress/progress.service';
import { ReportCardService } from './report-card.service';
import { todayInTimezone } from '../common/date.util';

interface MemberReport {
  name: string;
  isMaster: boolean;
  habits: { name: string; icon: string | null; completed: boolean; streak: number }[];
  completed: number;
  total: number;
  percent: number;
}

function formatHabitLine(h: { name: string; icon: string | null; completed: boolean; streak: number }): string {
  const icon = h.icon ?? '•';
  const status = h.completed ? '✅' : '❌';
  const streak = h.streak > 0 ? ` 🔥 ${h.streak} day streak` : '';
  return `  ${icon} ${h.name}  ${status}${streak}`;
}

function formatMemberSection(member: MemberReport, isCurrentUser: boolean): string[] {
  const label = isCurrentUser ? '📋 *Your Activity*' : `👤 *${member.name}*${member.isMaster ? ' 👑' : ''}`;
  const lines: string[] = [
    label,
    '─'.repeat(20),
  ];

  for (const h of member.habits) {
    lines.push(formatHabitLine(h));
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
   * Sends customized group reports to each member from the admin's WhatsApp account.
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

    // Use a central admin user for the WhatsApp connection
    const adminUser = await this.prisma.user.findUnique({ where: { email: 'thafsi@example.com' } });
    if (!adminUser) {
      this.logger.error('Central WhatsApp sender (thafsi@example.com) not found');
      return;
    }
    const senderId = adminUser.id;

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
    const memberReports: Map<string, MemberReport> = new Map();
    for (const member of tracker.members) {
      try {
        const dashboard = await this.dashboardService.getToday(member.user.id, trackerId, today);
        const monthly = await this.progressService.getMonthlyProgress(member.user.id, trackerId);

        memberReports.set(member.user.id, {
          name: member.user.name,
          isMaster: member.user.id === masterId,
          habits: dashboard.myHabits.map((h) => {
            const streak = monthly.habits.find(mh => mh.habitId === h.id)?.currentStreak ?? 0;
            return {
              name: h.name,
              icon: h.icon,
              completed: h.subtasks.length === 0 ? h.completed : h.subtasks.every((s) => s.completed),
              streak,
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

    // Send personalized image report to each member with a whatsappNumber
    for (const member of tracker.members) {
      const user = member.user;
      if (!user.whatsappNumber) continue;

      const currentUserReport = memberReports.get(user.id);
      if (!currentUserReport) continue;

      const otherMembers = tracker.members
        .filter(m => m.user.id !== user.id)
        .map(m => memberReports.get(m.user.id))
        .filter((r): r is MemberReport => !!r)
        .sort((a, b) => b.percent - a.percent);

      try {
        const image = await this.reportCardService.render({
          trackerName: tracker.name,
          userName: user.name,
          dateLabel,
          currentUser: { ...currentUserReport, isCurrentUser: true },
          otherMembers: otherMembers.map((m) => ({ ...m, isCurrentUser: false })),
        });

        const caption = `🌙 *Daily Habit Report*\n📌 ${tracker.name}\n📅 ${dateLabel}\n\nHey ${user.name} 👋\n\nYour progress: ${currentUserReport.completed}/${currentUserReport.total} (${currentUserReport.percent}%)`;

        const log = await this.prisma.notificationLog.create({
          data: {
            userId: user.id,
            trackerId,
            type: NotificationType.DAILY_REPORT,
            channel: NotificationChannel.WHATSAPP,
            status: 'PENDING',
            message: caption,
          },
        });

        const result = await this.whatsappService.sendImageToNumber(
          senderId,
          user.whatsappNumber,
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
          this.logger.warn(`Daily report image failed for user ${user.id} tracker ${trackerId}: ${result.error}`);
        }
      } catch (err) {
        this.logger.error(`Error sending report image for member ${user.id} in tracker ${trackerId}`, err as Error);
      }
    }
  }
}
