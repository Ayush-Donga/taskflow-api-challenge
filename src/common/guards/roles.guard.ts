import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

type Role = 'admin' | 'user';
type RoleHierarchy = Record<Role, Role[]>;

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user?: { role?: Role } } = context.switchToHttp().getRequest();

    if (!user?.role) {
      return false;
    }

    const roleHierarchy: RoleHierarchy = {
      admin: ['admin', 'user'],
      user: ['user'],
    };

    return roleHierarchy[user.role].some((role: Role) => requiredRoles.includes(role));
  }
}
