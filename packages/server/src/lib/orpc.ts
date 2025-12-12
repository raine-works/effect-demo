import { os } from '@orpc/server';
import { authMiddleware, type Session, type User } from '@server/lib/auth';
import type { bp } from '@server/lib/backplane';
import type { db } from '@server/lib/database';
import { loggerMiddleware } from '@server/lib/logger';

export type Context = {
	auth?: { user: User; session: Session };
	headers: Headers;
	db: typeof db;
	bp: typeof bp;
};

const base = os.$context<Context>().use(loggerMiddleware);
const publicProcedure = base;
const privateProcedure = base.use(authMiddleware);

export { publicProcedure, privateProcedure };
