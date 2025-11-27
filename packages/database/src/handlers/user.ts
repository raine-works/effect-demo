import { CustomError, tryCatch } from '@effect-demo/tools/utils/tryCatch';
import type { Prisma } from '@/database/generated/client';
import type { AbortableClient } from '@/database/lib/abortableClient';

export const userHandler = (abortable: AbortableClient) => {
	return {
		getAllUsers: async (args: { page: number; pageSize: number }, signal?: AbortSignal) => {
			const client = abortable.withAbort(signal);

			const skip = (args.page - 1) * args.pageSize;
			const take = skip + args.pageSize;
			const records = await client.$transaction([client.user.count(), client.user.findMany({ skip, take })]);

			return {
				page: args.page,
				pages: Math.max(Math.ceil(records[0] / args.pageSize), 1),
				records: records[1]
			};
		},
		createUser: async (args: Prisma.UserCreateArgs['data'], signal?: AbortSignal) => {
			const client = abortable.withAbort(signal);

			const { error, data } = await tryCatch(
				client.$transaction([client.user.create({ data: { name: args.name, email: args.email } })])
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

			return data[0];
		}
	};
};
