import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST } from '@nestjs/core';
import { CHECK_ACCESS_KEY } from './access.decorator';
import { ACCESS_MATRIX } from './access.matrix';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const meta = this.reflector.get(CHECK_ACCESS_KEY, context.getHandler()) as
      | { moduleKey: string; actionKey: string }
      | undefined;
    if (!meta) return true; // no access metadata, allow

    const { moduleKey, actionKey } = meta;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not attached to request');
    }

    const role = (user.role || '').toString();
    const moduleRules = (ACCESS_MATRIX as any)[moduleKey];

    if (!moduleRules) {
      throw new ForbiddenException(`No access rules for module: ${moduleKey}`);
    }

    const allowedActions: string[] = moduleRules[role];

    if (!allowedActions || !allowedActions.includes(actionKey)) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
