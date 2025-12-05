import { backplane } from '@effect-demo/backplane';
import { env } from '@server/lib/env';
import { createMiddleware } from 'hono/factory';

export const bp: Awaited<ReturnType<typeof backplane>> = await backplane({
	servers: [env.NATS_URL],
	user: env.NATS_USER,
	pass: env.NATS_PASS
});

export const useBackplane = createMiddleware(async (c, next) => {
	c.set('bp', bp);
	return next();
});

process.on('SIGTERM', async () => {
	console.log('Closing backplane connection...');
	await bp.$disconnect();
	process.exit(0);
});
