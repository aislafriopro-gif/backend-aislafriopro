import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '../../roles/entities/roles.entity';

interface AuthenticatedRequest {
  user?: {
    role: RoleName;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) throw new ForbiddenException('No autenticado');

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'No tenés permisos para acceder a este recurso',
      );
    }
    return true;
  }
}
