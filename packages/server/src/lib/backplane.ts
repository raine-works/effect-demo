import { backplane } from '@effect-demo/backplane';
import { env } from '@server/lib/env';

export const bp: Awaited<ReturnType<typeof backplane>> = await backplane({
	servers: [env.NATS_URL],
	user: env.NATS_USER,
	pass: env.NATS_PASS
});

process.on('SIGTERM', async () => {
	console.log('Closing backplane connection...');
	await bp.$disconnect();
	process.exit(0);
});
