import { Prisma, type PrismaClient } from '@database/generated/client';

export const cancellableExtension = Prisma.defineExtension((client) => {
	return client.$extends({
		name: 'cancellable',
		client: {
			async $cancellable<T>(action: (tx: Prisma.TransactionClient) => Promise<T>, signal: AbortSignal): Promise<T> {
				const contextClient = client as PrismaClient;

				return contextClient.$transaction(async (tx) => {
					if (signal.aborted) {
						throw new Error('ABORTED');
					}

					const abortPromise = new Promise<never>((_, reject) => {
						const onAbort = () => {
							signal.removeEventListener('abort', onAbort);
							reject(new Error('ABORTED'));
						};
						signal.addEventListener('abort', onAbort);
					});

					const actionPromise = action(tx).then((r) => r);

					return Promise.race([actionPromise, abortPromise]);
				});
			}
		}
	});
});
