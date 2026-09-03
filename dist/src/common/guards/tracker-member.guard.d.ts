import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../authorization.service';
export declare class TrackerMemberGuard implements CanActivate {
    private authz;
    private reflector;
    constructor(authz: AuthorizationService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
