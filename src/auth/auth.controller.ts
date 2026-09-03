import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuthTokens } from './types';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

function cookieOptions(maxAgeMs: number) {
  const isSecure = process.env.COOKIE_SECURE === 'true';
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ('none' as const) : ('lax' as const),
    maxAge: maxAgeMs,
    path: '/',
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000));
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.signup(dto);
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto);
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const { user, tokens } = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(refreshToken);
    this.clearAuthCookies(res);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.userId);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google; handler body never runs.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as {
      googleId: string;
      email: string;
      name: string;
      avatarUrl?: string;
    };
    const user = await this.authService.findOrCreateGoogleUser(profile);
    const tokens = await this.authService.issueTokens(user.id, user.email);
    this.setAuthCookies(res, tokens);
    res.redirect(`${process.env.APP_URL}/auth/callback`);
  }
}
