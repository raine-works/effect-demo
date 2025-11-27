/** biome-ignore-all lint/suspicious/noExplicitAny: needed */
import type { PrismaClient } from '@/database/generated/client';

export class AbortableClient {
	constructor(private readonly client: PrismaClient) {}

	/**
	 * Returns a proxy Prisma client that runs all operations inside
	 * an interactive transaction that rolls back on abort.
	 */
	withAbort(signal?: AbortSignal): PrismaClient {
		if (!signal) return this.client;

		if (signal.aborted) {
			throw new Error('ABORTED');
		}

		// Wrap all queries in an interactive transaction
		return new Proxy(this.client, {
			get: (_, prop) => {
				// Pass through meta, $on, $connect, etc
				if (typeof (this.client as any)[prop] !== 'function') {
					return (this.client as any)[prop];
				}

				// Wrap a Prisma method
				return async (...args: any[]) => {
					return this.client.$transaction(async (tx) => {
						const abortHandler = () => {
							throw new Error('ABORTED');
						};

						signal.addEventListener('abort', abortHandler);

						try {
							const method = (tx as any)[prop];
							return method.apply(tx, args);
						} finally {
							signal.removeEventListener('abort', abortHandler);
						}
					});
				};
			}
		}) as PrismaClient;
	}
}
