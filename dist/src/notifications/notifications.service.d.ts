import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ProgressService } from '../progress/progress.service';
import { ReportCardService } from './report-card.service';
export declare class NotificationsService {
    private prisma;
    private dashboardService;
    private progressService;
    private reportCardService;
    private readonly logger;
    constructor(prisma: PrismaService, dashboardService: DashboardService, progressService: ProgressService, reportCardService: ReportCardService);
    sendTrackerReports(trackerId: string): Promise<void>;
}
