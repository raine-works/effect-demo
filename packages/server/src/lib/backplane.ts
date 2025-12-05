import { backplane } from '@effect-demo/backplane';
import { tryCatch } from '@effect-demo/tools';
import { env } from '@server/lib/env';
import { createMiddleware } from 'hono/factory';

export const useBackplane = createMiddleware(async (c, next) => {
	const { error, data: bp } = await tryCatch(
		backplane({ servers: [env.NATS_URL], user: env.NATS_USER, pass: env.NATS_PASS })
	);

	if (error) {
		console.log(error.message);
		return next();
	}

	process.on('SIGTERM', async () => {
		console.log('Closing backplane connection...');
		await bp.$disconnect();
		process.exit(0);
	});

	c.set('bp', bp);
	return next();
});
