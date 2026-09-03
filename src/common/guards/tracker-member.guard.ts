import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TrackerRole } from '@prisma/client';
import { AuthorizationService } from '../authorization.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * For routes shaped /trackers/:trackerId/... — confirms the authenticated
 * user (from JwtAuthGuard, which must run first) is a member of :trackerId,
 * and if @Roles(...) is set on the handler, that their role qualifies.
 * Attaches the resolved membership to the request as req.membership so
 * handlers never need to re-derive it or trust a client-supplied role.
 */
@Injectable()
export class TrackerMemberGuard implements CanActivate {
  constructor(
    private authz: AuthorizationService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const trackerId = request.params.trackerId;
    const user = request.user;

    const requiredRoles = this.reflector.getAllAndOverride<TrackerRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const membership =
      requiredRoles?.length && requiredRoles.length > 0 && !requiredRoles.includes(TrackerRole.MEMBER)
        ? await this.authz.requireMaster(user.userId, trackerId)
        : await this.authz.getMembership(user.userId, trackerId);

    request.membership = membership;
    return true;
  }
}
