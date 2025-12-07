import type { backplane } from '@effect-demo/backplane';
import type { database } from '@effect-demo/database';
import { bp, useBackplane } from '@server/lib/backplane';
import { db, useDatabase } from '@server/lib/database';
import { env } from '@server/lib/env';
import { socketRoute } from '@server/routes/socket';
import { userRoute } from '@server/routes/user';
import { serve } from 'bun';
import { Hono } from 'hono';
import { websocket } from 'hono/bun';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';

export type HonoEnv = {
	Variables: {
		db: ReturnType<typeof database>;
		bp: Awaited<ReturnType<typeof backplane>>;
	};
};

const controller = new AbortController();

const app = new Hono<HonoEnv>()
	.use(
		'/api/*',
		cors({
			origin: '*',
			allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type'],
			allowMethods: ['POST', 'GET', 'OPTIONS'],
			exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
			maxAge: 600,
			credentials: true
		})
	)
	.use(compress({ encoding: 'gzip' }))
	.get('/healthz', (c) => c.text('OK'));

const api = app.use(useDatabase).use(useBackplane).basePath('/api').route('/ws', socketRoute).route('/user', userRoute);

const startServer = (port: number) => {
	console.log(`Starting server on port ${port}...`);
	return serve({
		hostname: '0.0.0.0',
		fetch: api.fetch,
		websocket,
		development: env.NODE_ENV === 'development',
		port
	});
};

const server = startServer(Number(env.PORT));

process.on('SIGTERM', async () => {
	console.log('Stopping server...');
	await server.stop();
	controller.abort();
	process.exit(0);
});

type Api = typeof api;

export type { Api };

db.client.$subscribe(
	'User:create',
	(data) => {
		bp.client.publish('User:create', bp.jsonCodec.encode(data));
	},
	controller.signal
);
