import { useDatabase } from '@server/lib/database';
import { env } from '@server/lib/env';
import { userRoute } from '@server/routes/user';
import { serve } from 'bun';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';

const app = new Hono()
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

const api = app.use(useDatabase).basePath('/api').route('/user', userRoute);

const startServer = (port: number) => {
	console.log(`Starting server on port ${port}...`);
	return serve({
		hostname: '0.0.0.0',
		fetch: api.fetch,
		development: env.NODE_ENV === 'development',
		port
	});
};

const server = startServer(Number(env.PORT));

process.on('SIGTERM', async () => {
	console.log('Stopping server...');
	await server.stop();
	process.exit(0);
});

type Api = typeof api;

export type { Api };
