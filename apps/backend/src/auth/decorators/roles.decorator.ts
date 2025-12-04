import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@lourd-game/shared';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

