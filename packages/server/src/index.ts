import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { env } from '@server/lib/env';
import { router } from '@server/routes/test';
import { serve } from 'bun';

const handler = new RPCHandler(router, {
	plugins: [new CORSPlugin()],
	interceptors: [
		onError((error) => {
			console.error((error as Error).message);
		})
	]
});

const startServer = (port: number) => {
	console.log(`Starting server on port ${port}...`);
	return serve({
		port,
		development: env.NODE_ENV === 'development',
		hostname: '0.0.0.0',
		async fetch(request: Request) {
			const { matched, response } = await handler.handle(request, {
				prefix: '/rpc',
				context: {}
			});

			if (matched) {
				return response;
			}

			return new Response('Not found', { status: 404 });
		}
	});
};

const server = startServer(Number(env.PORT));

process.on('SIGTERM', async () => {
	console.log('Stopping server...');
	await server.stop();
	process.exit(0);
});

type Router = typeof router;

export type { Router };
