import type { Router } from '@effect-demo/server';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
// import { OpenAPILink } from '@orpc/openapi-client/fetch';
import type { RouterClient } from '@orpc/server';

const link = new RPCLink({
	url: 'http://localhost:3000/rpc',
	async fetch(request, init) {
		const { fetch } = await import('expo/fetch');

		const resp = await fetch(request.url, {
			body: await request.blob(),
			headers: request.headers,
			method: request.method,
			signal: request.signal,
			credentials: 'include',
			...init
		});

		return resp;
	}
});

export const client: RouterClient<Router> = createORPCClient(link);
