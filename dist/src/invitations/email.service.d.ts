export declare class EmailService {
    private readonly logger;
    send(to: string, subject: string, body: string): Promise<void>;
}
