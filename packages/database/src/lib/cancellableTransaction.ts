import { Prisma, type PrismaClient } from '@database/generated/client';

export const cancellableTransactionExtension = Prisma.defineExtension((client) => {
	return client.$extends({
		name: 'cancellableTransaction',
		client: {
			async $cancellableTransaction<T>(
				signal: AbortSignal,
				action: (tx: Prisma.TransactionClient) => Promise<T>
			): Promise<T> {
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
