import { os } from '@orpc/server';

export const loggerMiddleware = os.middleware(async ({ path, next }) => {
	console.log(path);

	return next();
});
