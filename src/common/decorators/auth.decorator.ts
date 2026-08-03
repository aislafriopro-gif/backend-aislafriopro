import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { RoleName } from '../../roles/entities/roles.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

export function Auth(...roles: RoleName[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({ description: 'Token inválido o ausente' }),
    ApiForbiddenResponse({ description: 'No tenés el rol requerido' }),
  );
}
