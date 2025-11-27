import { database } from '@effect-demo/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@server/lib/env';
import { createMiddleware } from 'hono/factory';

const adapter = new PrismaPg(env.DATABASE_URL);
const db = database(adapter);

export const useDatabase = createMiddleware(async (c, next) => {
	c.set('db', db);
	return next();
});

process.on('SIGTERM', async () => {
	console.log('Closing database connection...');
	await db.client.$disconnect();
	process.exit(0);
});
