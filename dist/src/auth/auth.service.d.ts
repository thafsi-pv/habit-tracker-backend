import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { AuthTokens } from './types';
export interface PublicUser {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    timezone: string;
    notificationsEnabled: boolean;
    notificationTime: string | null;
    whatsappNumber: string | null;
}
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    signup(dto: SignupDto): Promise<{
        user: PublicUser;
        tokens: AuthTokens;
    }>;
    login(dto: LoginDto): Promise<{
        user: PublicUser;
        tokens: AuthTokens;
    }>;
    findOrCreateGoogleUser(profile: {
        googleId: string;
        email: string;
        name: string;
        avatarUrl?: string;
    }): Promise<PublicUser>;
    issueTokens(userId: string, email: string): Promise<AuthTokens>;
    refresh(refreshToken: string): Promise<{
        user: PublicUser;
        tokens: AuthTokens;
    }>;
    logout(refreshToken: string | undefined): Promise<void>;
    me(userId: string): Promise<PublicUser>;
}
