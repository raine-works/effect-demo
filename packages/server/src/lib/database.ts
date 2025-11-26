import { database } from '@effect-demo/database';
import { createMiddleware } from 'hono/factory';
import { env } from '@/lib/env';

const db = database(env.DATABASE_URL);

export const useDatabase = createMiddleware(async (c, next) => {
	c.set('db', db);
	return next();
});

process.on('SIGTERM', async () => {
	console.log('Closing database connection...');
	await db.client.$disconnect();
	process.exit(0);
});
