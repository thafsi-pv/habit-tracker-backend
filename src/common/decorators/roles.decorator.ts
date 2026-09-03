import { SetMetadata } from '@nestjs/common';
import { TrackerRole } from '@prisma/client';

export const ROLES_KEY = 'trackerRoles';
export const Roles = (...roles: TrackerRole[]) => SetMetadata(ROLES_KEY, roles);
