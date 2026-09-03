import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private setAuthCookies;
    private clearAuthCookies;
    signup(dto: SignupDto, res: Response): Promise<{
        user: import("./auth.service").PublicUser;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        user: import("./auth.service").PublicUser;
    }>;
    refresh(req: Request, res: Response): Promise<{
        user: import("./auth.service").PublicUser;
    }>;
    logout(req: Request, res: Response): Promise<{
        success: boolean;
    }>;
    me(user: AuthenticatedUser): Promise<import("./auth.service").PublicUser>;
    googleAuth(): Promise<void>;
    googleCallback(req: Request, res: Response): Promise<void>;
}
