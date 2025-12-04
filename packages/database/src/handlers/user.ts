import type { Prisma } from '@database/generated/client';
import type { ExtendedPrismaClient } from '@database/index';
import { CustomError, tryCatch } from '@effect-demo/tools';

export const userHandler = (client: ExtendedPrismaClient) => {
	return {
		getAllUsers: async (args: { page: number; pageSize: number }, signal: AbortSignal) => {
			const skip = (args.page - 1) * args.pageSize;
			const take = skip + args.pageSize;
			const { error, data } = await tryCatch(
				client.$cancellable(async (tx) => {
					return {
						count: await tx.user.count(),
						records: await tx.user.findMany({ skip, take })
					};
				}, signal)
			);

			if (error) {
				throw error;
			}

			return {
				page: args.page,
				pages: Math.max(Math.ceil(data.count / args.pageSize), 1),
				records: data.records
			};
		},
		createUser: async (args: Prisma.UserCreateArgs['data'], signal: AbortSignal) => {
			const { error, data } = await tryCatch(
				client.$cancellable(async (tx) => {
					return await tx.user.create({ data: { name: args.name, email: args.email } });
				}, signal)
			);

			if (error?.code === 'P2002') {
				throw new CustomError({
					message: `A user with the email address ${args.email} already exists.`,
					code: error.code,
					cause: error
				});
			}

			if (error) {
				throw error;
			}

			return data;
		}
	};
};
