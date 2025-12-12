import { os } from '@orpc/server';
import type { Context } from '@server/lib/orpc';

export const loggerMiddleware = os.$context<Context>().middleware(async ({ path, next }) => {
	console.log(path);

	return next();
});
