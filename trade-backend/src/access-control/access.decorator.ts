import { SetMetadata } from '@nestjs/common';

export const CHECK_ACCESS_KEY = 'check_access';

export type ModuleKey = string;
export type ActionKey = string;

export const CheckAccess = (moduleKey: ModuleKey, actionKey: ActionKey) =>
  SetMetadata(CHECK_ACCESS_KEY, { moduleKey, actionKey });
