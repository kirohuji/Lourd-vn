import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@nqtr-game/shared';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

