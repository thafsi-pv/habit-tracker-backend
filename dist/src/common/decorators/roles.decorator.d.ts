import { TrackerRole } from '@prisma/client';
export declare const ROLES_KEY = "trackerRoles";
export declare const Roles: (...roles: TrackerRole[]) => import("@nestjs/common").CustomDecorator<string>;
