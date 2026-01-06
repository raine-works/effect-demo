import type { Router } from '@effect-demo/server';
import { tryCatch } from '@effect-demo/tools/lib/tryCatch';
import { storage } from '@mobile/lib/localStorage';
import { createORPCClient } from '@orpc/client';
import type { ContractRouterClient } from '@orpc/contract';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';

const SERVER_URL = 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 15000;

export const rpcClient = async () => {
	let router: Router | null = null;
	const contractRouter = await storage.session.get('contractRouter');

	if (contractRouter) {
		router = JSON.parse(contractRouter);
	}

	if (!router) {
		const { error, data } = await tryCatch(fetch(`${SERVER_URL}/contract.json`));

		if (error || !data) {
			console.log(error?.message);
			throw new Error('Cannot find contract.json');
		}

		router = (await data.json()) as Router;
		await storage.session.set('contractRouter', JSON.stringify(router));
	}

	const link = new OpenAPILink(router, {
		url: `${SERVER_URL}/rpc`,
		async fetch(request, init) {
			const { fetch } = await import('expo/fetch');

			// 1. Setup Timeout Controller
			const timeoutController = new AbortController();
			const timeoutId = setTimeout(() => {
				timeoutController.abort(new Error('RPC_TIMEOUT'));
			}, REQUEST_TIMEOUT_MS);

			const requestInit = init as RequestInit;
			let signal = timeoutController.signal;

			if (requestInit?.signal && 'any' in AbortSignal) {
				signal = (AbortSignal as any).any([timeoutController.signal, requestInit.signal]);
			}

			try {
				const accessToken = await storage.local.get('accessToken');
				const headers = new Headers(request.headers);
				if (accessToken) {
					headers.set('Authorization', `Bearer ${accessToken}`);
				}

				const isGetOrHead = ['GET', 'HEAD'].includes(request.method.toUpperCase());

				// IMPORTANT: Consume the body ONCE here so we can reuse it for the retry
				const body = isGetOrHead ? undefined : await request.blob();

				// First Attempt
				let response = await fetch(request.url, {
					body,
					headers,
					method: request.method,
					signal: signal,
					...init
				});

				// 2. Handle 401 Refresh & Retry Logic
				if (response.status === 401) {
					const refreshToken = await storage.local.get('refreshToken');

					if (refreshToken) {
						// Attempt to get a new access token
						const newAccessToken = await refreshAuthTokens(refreshToken);

						if (newAccessToken) {
							// Update the headers with the new token
							const retryHeaders = new Headers(headers);
							retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

							// Perform the Retry
							// We use the 'body' variable we saved earlier
							response = await fetch(request.url, {
								body,
								headers: retryHeaders,
								method: request.method,
								signal: signal,
								...init
							});
						}
					}
				}

				return response;
			} catch (err: any) {
				if (signal.aborted) {
					console.error('Request Aborted. Reason:', signal.reason);
				}
				throw err;
			} finally {
				clearTimeout(timeoutId);
			}
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

		if (!response.ok) throw new Error('Refresh request failed');

		const data = await response.json();
		if (data.accessToken) {
			await storage.local.set('accessToken', data.accessToken);
			return data.accessToken;
		}
	} catch (e) {
		console.error('Refresh failed', e);
	}

	// If refresh fails, clear everything so the user is forced to log in again
	await storage.local.delete('accessToken');
	await storage.local.delete('refreshToken');
	return null;
};
