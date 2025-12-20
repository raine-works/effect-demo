import { Temporal } from '@js-temporal/polyfill';
import { minifyContractRouter } from '@orpc/contract';
import { OpenAPIGenerator } from '@orpc/openapi';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError } from '@orpc/server';
import { CORSPlugin } from '@orpc/server/plugins';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { bp } from '@server/lib/backplane';
import { db } from '@server/lib/database';
import { env } from '@server/lib/env';
import { base } from '@server/lib/orpc';
import { authContract } from '@server/routes/auth';
import { userContract } from '@server/routes/user';
import { serve } from 'bun';

const generator = new OpenAPIGenerator({
	schemaConverters: [new ZodToJsonSchemaConverter()]
});

const router = base.router({
	auth: authContract,
	user: userContract
});

const contract = minifyContractRouter(router);

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
	plugins: [
		new CORSPlugin({
			origin: 'http://localhost:8081',
			credentials: true,
			allowHeaders: ['Content-Type', 'Authorization']
		})
	],
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
			'/healthz': new Response('OK', { status: 200 }),
			'/openapi.json': new Response(JSON.stringify(spec, null, 2), {
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Content-Disposition': 'inline'
				}
			}),
			'/contract.json': new Response(JSON.stringify(contract, null, 2), {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json; charset=utf-8',
					'Content-Disposition': 'inline'
				}
			})
		},
		async fetch(request: Request) {
			const { matched, response } = await handler.handle(request, {
				prefix: '/rpc',
				context: { temporal: Temporal, headers: request.headers, db, bp }
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

export type Router = typeof router;
