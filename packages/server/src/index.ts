import { OpenAPIGenerator } from '@orpc/openapi';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError } from '@orpc/server';
import { CORSPlugin } from '@orpc/server/plugins';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { env } from '@server/lib/env';
import { testRouter } from '@server/routes/test';
import { serve } from 'bun';

const router = {
	test: testRouter
};

const generator = new OpenAPIGenerator({
	schemaConverters: [new ZodToJsonSchemaConverter()]
});

const spec = await generator.generate(router, {
	info: {
		title: 'Demo API',
		version: '1.0.0'
	},
	servers: [
		{
			url: 'http://localhost:3000/rpc'
		}
	]
});

const handler = new OpenAPIHandler(router, {
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
		routes: {
			'/openapi.json': new Response(JSON.stringify(spec, null, 2), {
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Content-Disposition': 'inline'
				}
			})
		},
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
