import { useDatabase } from '@server/lib/database';
import { env } from '@server/lib/env';
import { userRoute } from '@server/routes/user';
import { serve } from 'bun';
import { Hono } from 'hono';
import { compress } from 'hono/compress';

const app = new Hono();
app.use(compress({ encoding: 'gzip' }));
app.get('/healthz', (c) => c.text('OK'));

const api = app.basePath('/api');
api.use(useDatabase);
api.route('/user', userRoute);

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
