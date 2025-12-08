import { database } from '@effect-demo/database';
import { env } from '@server/lib/env';

export const db: ReturnType<typeof database> = database(env.DATABASE_URL);

process.on('SIGTERM', async () => {
	console.log('Closing database connection...');
	await db.client.$disconnect();
	process.exit(0);
});
