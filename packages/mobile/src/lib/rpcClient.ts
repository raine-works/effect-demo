import type { Router } from '@effect-demo/server';
import { tryCatch } from '@effect-demo/tools/lib/tryCatch';
import { storage } from '@mobile/lib/localStorage';
import { createORPCClient } from '@orpc/client';
import type { ContractRouterClient } from '@orpc/contract';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';

const SERVER_URL = 'http://localhost:3000';

export const rpcClient = async () => {
	let router: Router | null = null;
	const contractRouter = await storage.session.get('contractRouter');

	if (contractRouter) {
		router = JSON.parse(contractRouter);
	}

	if (!router) {
		const { error, data } = await tryCatch(fetch(`${SERVER_URL}/contract.json`));

		if (error || !data) {
			console.log(error.message);
			throw new Error('Cannot find contract.json');
		}

		router = (await data.json()) as Router;
		await storage.session.set('contractRouter', JSON.stringify(router));
	}

	const link = new OpenAPILink(router, {
		url: `${SERVER_URL}/rpc`,
		async fetch(request, init) {
			const { fetch } = await import('expo/fetch');

			const accessToken = await storage.local.get('accessToken');

			const headers = new Headers(request.headers);
			if (accessToken) {
				headers.set('Authorization', `Bearer ${accessToken}`);
			}

			const isGetOrHead = ['GET', 'HEAD'].includes(request.method.toUpperCase());

			let response = await fetch(request.url, {
				body: isGetOrHead ? undefined : await request.blob(),
				headers: headers,
				method: request.method,
				signal: request.signal,
				...init
			});

			if (response.status === 401) {
				const refreshToken = await storage.local.get('refreshToken');

				if (refreshToken) {
					const newAccessToken = await refreshAuthTokens(refreshToken);

					if (newAccessToken) {
						headers.set('Authorization', `Bearer ${newAccessToken}`);
						response = await fetch(request.url, {
							body: isGetOrHead ? undefined : await request.blob(),
							headers: headers,
							method: request.method,
							signal: request.signal,
							...init
						});
					}
				}
			}

			return response;
		}
	});

	return createORPCClient<JsonifiedClient<ContractRouterClient<Router>>>(link);
};

/**
 * Helper to call your backend refresh endpoint.
 */
const refreshAuthTokens = async (refreshToken: string): Promise<string | null> => {
	try {
		const response = await fetch(`${SERVER_URL}/rpc/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken })
		});

		const data = await response.json();
		if (data.accessToken) {
			await storage.local.set('accessToken', data.accessToken);
			return data.accessToken;
		}
	} catch (e) {
		console.error('Refresh failed', e);
	}

	await storage.local.delete('accessToken');
	await storage.local.delete('refreshToken');
	return null;
};
