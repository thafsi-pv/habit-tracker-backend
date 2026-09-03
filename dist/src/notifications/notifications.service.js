"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const dashboard_service_1 = require("../dashboard/dashboard.service");
const progress_service_1 = require("../progress/progress.service");
const report_card_service_1 = require("./report-card.service");
const date_util_1 = require("../common/date.util");
function formatHabitLine(h) {
    const icon = h.icon ?? '•';
    const status = h.completed ? '✅' : '❌';
    const streak = h.streak > 0 ? ` 🔥 ${h.streak} day streak` : '';
    return `  ${icon} ${h.name}  ${status}${streak}`;
}
function formatMemberSection(member, isCurrentUser) {
    const label = isCurrentUser ? '📋 *Your Activity*' : `👤 *${member.name}*${member.isMaster ? ' 👑' : ''}`;
    const lines = [
        label,
        '─'.repeat(20),
    ];
    for (const h of member.habits) {
        lines.push(formatHabitLine(h));
        lines.push('');
    }
    const bar = buildProgressBar(member.percent);
    lines.push(`  📊 ${member.completed}/${member.total} completed  ${bar}  ${member.percent}%`);
    if (member.percent === 100) {
        lines.push('  🎉 Perfect day!');
    }
    return lines;
}
function buildProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
}
function buildReportMessage(params) {
    const { trackerName, userName, dateLabel, currentUser, otherMembers } = params;
    const allMembers = [currentUser, ...otherMembers];
    const totalCompleted = allMembers.reduce((s, m) => s + m.completed, 0);
    const totalHabits = allMembers.reduce((s, m) => s + m.total, 0);
    const overallPercent = totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;
    const lines = [
        '🌙 *Daily Habit Report*',
        '',
        `📌 *${trackerName}*`,
        `📅 ${dateLabel}`,
        '',
        `Hey ${userName} 👋`,
        '',
        ...formatMemberSection(currentUser, true),
        '',
    ];
    for (const member of otherMembers) {
        lines.push(...formatMemberSection(member, false));
        lines.push('');
    }
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
    }
    else if (overallPercent >= 75) {
        lines.push('  💪 Great teamwork!');
    }
    else {
        lines.push('  🔥 Let\'s push harder tomorrow!');
    }
    return lines.join('\n');
}
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, dashboardService, progressService, reportCardService) {
        this.prisma = prisma;
        this.dashboardService = dashboardService;
        this.progressService = progressService;
        this.reportCardService = reportCardService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async sendTrackerReports(trackerId) {
        const tracker = await this.prisma.tracker.findUnique({
            where: { id: trackerId },
            include: {
                owner: true,
                members: { include: { user: true } },
            },
        });
        if (!tracker)
            return;
        const adminUser = await this.prisma.user.findUnique({ where: { email: 'thafsi@example.com' } });
        if (!adminUser) {
            this.logger.error('Central WhatsApp sender (thafsi@example.com) not found');
            return;
        }
        const senderId = adminUser.id;
        const masterId = tracker.ownerId;
        const masterTimezone = tracker.owner.timezone;
        const today = (0, date_util_1.todayInTimezone)(masterTimezone);
        const dateLabel = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
        });
        const memberReports = new Map();
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
            }
            catch (err) {
                this.logger.error(`Error fetching data for member ${member.user.id}`, err);
            }
        }
        for (const member of tracker.members) {
            const user = member.user;
            if (!user.whatsappNumber)
                continue;
            const currentUserReport = memberReports.get(user.id);
            if (!currentUserReport)
                continue;
            const otherMembers = tracker.members
                .filter(m => m.user.id !== user.id)
                .map(m => memberReports.get(m.user.id))
                .filter((r) => !!r)
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
                        type: client_1.NotificationType.DAILY_REPORT,
                        channel: client_1.NotificationChannel.WHATSAPP,
                        status: 'PENDING',
                        message: caption,
                    },
                });
                const result = { success: false, error: 'WhatsApp is temporarily paused' };
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
            }
            catch (err) {
                this.logger.error(`Error sending report image for member ${user.id} in tracker ${trackerId}`, err);
            }
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dashboard_service_1.DashboardService,
        progress_service_1.ProgressService,
        report_card_service_1.ReportCardService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map