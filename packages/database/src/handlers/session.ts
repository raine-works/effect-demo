import type { Prisma } from '@database/generated/client';
import type { ExtendedPrismaClient } from '@database/index';
import { tryCatch } from '@effect-demo/tools';

export const sessionHandler = (client: ExtendedPrismaClient) => {
	return {
		getSessionById: async (args: { id: string }, signal?: AbortSignal) => {
			const { error, data } = await tryCatch(
				client.$cancellable(async (tx) => {
					return await tx.session.findUnique({ where: { id: args.id } });
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
