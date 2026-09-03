import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtAccessPayload } from './types';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

function extractFromCookie(req: Request): string | null {
  return req?.cookies?.access_token ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  validate(payload: JwtAccessPayload): AuthenticatedUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
