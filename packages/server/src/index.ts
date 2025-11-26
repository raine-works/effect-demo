import { database } from '@effect-demo/database';
import { serve } from 'bun';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { env } from '@/lib/env';

const db = database(env.DATABASE_URL);

console.log(await db.handlers.user.getAllUsers());

const app = new Hono();
app.use(compress({ encoding: 'gzip' }));
app.get('/healthz', (c) => c.text('OK'));

const api = app.basePath('/api');

const startServer = (port: number) => {
	console.log(`Starting server on port ${port}...`);
	return serve({
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
