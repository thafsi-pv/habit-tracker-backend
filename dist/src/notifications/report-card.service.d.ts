interface HabitRow {
    name: string;
    icon: string | null;
    completed: boolean;
    streak: number;
}
interface MemberCardData {
    name: string;
    isMaster: boolean;
    isCurrentUser: boolean;
    habits: HabitRow[];
    completed: number;
    total: number;
    percent: number;
}
interface ReportImageParams {
    trackerName: string;
    userName: string;
    dateLabel: string;
    currentUser: MemberCardData;
    otherMembers: MemberCardData[];
}
export declare class ReportCardService {
    private readonly logger;
    private readonly fontPath;
    private cachedFont;
    private getFont;
    render(params: ReportImageParams): Promise<Buffer>;
    private estimateHeight;
    private buildJsx;
}
export {};
