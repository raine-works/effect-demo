import type { Prisma } from '@effect-demo/database';
import type { Temporal } from '@js-temporal/polyfill';
import { os } from '@orpc/server';
import { authMiddleware } from '@server/lib/auth';
import type { bp } from '@server/lib/backplane';
import type { db } from '@server/lib/database';
import { loggerMiddleware } from '@server/lib/logger';

export type Context = {
	temporal: typeof Temporal;
	user?: Prisma.UserGetPayload<{}>;
	session?: Prisma.SessionGetPayload<{}>;
	headers: Headers;
	db: typeof db;
	bp: typeof bp;
};

const base = os.$context<Context>().use(loggerMiddleware);
const publicProcedure = base;
const privateProcedure = base.use(authMiddleware);

export { base, publicProcedure, privateProcedure };
