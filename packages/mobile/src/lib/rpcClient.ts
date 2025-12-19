import { createORPCClient } from '@orpc/client';
import type { ContractRouterClient } from '@orpc/contract';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { contract } from '@server/routes/index';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const link = new OpenAPILink(contract, {
	url: 'http://localhost:3000/rpc',
	async fetch(request, init) {
		const { fetch } = await import('expo/fetch');

		// 1. Get the Access Token from storage
		const accessToken = await getToken('accessToken');

		// 2. Clone headers and inject Bearer token
		const headers = new Headers(request.headers);
		if (accessToken) {
			headers.set('Authorization', `Bearer ${accessToken}`);
		}

		// 3. Make the initial request
		let response = await fetch(request.url, {
			body: await request.blob(),
			headers: headers,
			method: request.method,
			signal: request.signal,
			...init
		});

		// 4. Handle 401 Unauthorized (Token expired)
		if (response.status === 401) {
			const refreshToken = await getToken('refreshToken');

			if (refreshToken) {
				// Attempt to get a new access token
				const newAccessToken = await refreshAuthTokens(refreshToken);

				if (newAccessToken) {
					// Retry the original request with the new token
					headers.set('Authorization', `Bearer ${newAccessToken}`);
					response = await fetch(request.url, {
						body: await request.blob(),
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

/**
 * Helper to call your backend refresh endpoint
 */
const refreshAuthTokens = async (refreshToken: string): Promise<string | null> => {
	try {
		const response = await fetch('http://localhost:3000/rpc/auth/refresh', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken })
		});

		const data = await response.json();
		if (data.accessToken) {
			await setToken('accessToken', data.accessToken);
			return data.accessToken;
		}
	} catch (e) {
		console.error('Refresh failed', e);
	}

	// If refresh fails, log the user out
	await deleteToken('accessToken');
	await deleteToken('refreshToken');
	return null;
};

/**
 * Get secure storage
 */
const getToken = async (key: string) => {
	if (Platform.OS === 'web') {
		return localStorage.getItem(key);
	}
	return await SecureStore.getItemAsync(key);
};

/**
 * Set secure storage
 */
const setToken = async (key: string, value: string) => {
	if (Platform.OS === 'web') {
		return localStorage.setItem(key, value);
	}
	return await SecureStore.setItemAsync(key, value);
};

/**
 * Delete secure storage
 */
const deleteToken = async (key: string) => {
	if (Platform.OS === 'web') {
		return localStorage.removeItem(key);
	}
	return await SecureStore.deleteItemAsync(key);
};

export const client: JsonifiedClient<ContractRouterClient<typeof contract>> = createORPCClient(link);
