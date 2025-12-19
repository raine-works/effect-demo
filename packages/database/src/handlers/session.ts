import type { Prisma } from '@database/generated/client';
import type { ExtendedPrismaClient } from '@database/index';
import { tryCatch } from '@effect-demo/tools/lib/tryCatch';

export const sessionHandler = (client: ExtendedPrismaClient) => {
	return {
		getSession: async (args: { id: string }, signal?: AbortSignal) => {
			const { error, data } = await tryCatch(
				client.$cancellable(async (tx) => {
					return await tx.session.findUnique({
						where: { id: args.id, expiresAt: { gt: new Date() } }
					});
				}, signal)
			);

			if (error) {
				throw error;
			}

			return data;
		},
		createSession: async (
			args: Pick<Prisma.SessionUncheckedCreateInput, 'userId' | 'expiresAt' | 'ipAddress' | 'userAgent'>,
			signal?: AbortSignal
		) => {
			const { error, data } = await tryCatch(
				client.$cancellable(async (tx) => {
					return await tx.session.create({ data: args });
				}, signal)
			);

			if (error) {
				throw error;
			}

			return data;
		}
	};
};
