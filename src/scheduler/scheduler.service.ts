import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function currentHHmmInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date()); // "HH:mm"
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runDailyReports(): Promise<void> {
    const masters = await this.prisma.user.findMany({
      where: { notificationsEnabled: true, notificationTime: { not: null } },
      include: { ownedTrackers: true },
    });

    for (const master of masters) {
      const nowHHmm = currentHHmmInTimezone(master.timezone);
      if (nowHHmm !== master.notificationTime) continue;

      for (const tracker of master.ownedTrackers) {
        try {
          await this.notificationsService.sendTrackerReports(tracker.id);
        } catch (err) {
          this.logger.error(
            `Failed scheduled report for tracker ${tracker.id}`,
            err as Error,
          );
        }
      }
    }
  }
}
