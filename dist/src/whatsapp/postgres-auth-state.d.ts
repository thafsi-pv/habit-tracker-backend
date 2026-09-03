import { AuthenticationState } from '@whiskeysockets/baileys';
import { PrismaService } from '../prisma/prisma.service';
export declare function usePostgresAuthState(prisma: PrismaService, userId: string): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
export declare function clearAuthState(prisma: PrismaService, userId: string): Promise<void>;
