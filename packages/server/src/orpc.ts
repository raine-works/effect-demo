import { os } from '@orpc/server';
import { loggerMiddleware } from '@server/lib/logger';

export const base = os.$context().use(loggerMiddleware);
