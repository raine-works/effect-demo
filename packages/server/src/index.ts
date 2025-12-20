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
const allowedOrigins = ['http://localhost:8081'];

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
			origin: allowedOrigins,
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
			'/healthz': new Response('OK', { status: 200 })
		},
		async fetch(request: Request) {
			const { matched, response } = await handler.handle(request, {
				prefix: '/rpc',
				context: { temporal: Temporal, headers: request.headers, db, bp }
			});

			if (matched) {
				return response;
			}

			const url = new URL(request.url);

			/**
			 * OPEN API SPEC
			 */
			if (url.pathname === '/openapi.json') {
				return new Response(JSON.stringify(spec, null, 2), {
					status: 200,
					headers: {
						'Content-Type': 'application/json; charset=utf-8',
						'Content-Disposition': 'inline'
					}
				});
			}

			/**
			 * CONTRACT ROUTER JSON
			 */
			if (url.pathname === '/contract.json') {
				const origin = request.headers.get('Origin');
				const isAllowed = origin && allowedOrigins.includes(origin);
				const headers = new Headers({
					'Content-Type': 'application/json; charset=utf-8',
					'Content-Disposition': 'inline',
					Vary: 'Origin'
				});

				if (isAllowed) {
					headers.set('Access-Control-Allow-Origin', origin);
				}

				return new Response(JSON.stringify(contract, null, 2), {
					status: 200,
					headers: headers
				});
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
