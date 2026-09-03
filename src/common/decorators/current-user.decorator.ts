import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

/**
 * Extracts the authenticated user from the request.
 * This is populated ONLY by JwtAuthGuard from a verified JWT — it is never
 * trusted from a request body/param, closing the IDOR risk of a client
 * sending an arbitrary userId.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
