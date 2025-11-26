import { CustomError, tryCatch } from '@effect-demo/tools/utils/tryCatch';
import type { Prisma, PrismaClient } from '@/database/generated/client';

export const userHandler = (client: PrismaClient) => {
	return {
		getAllUsers: async (args: { page: number; pageSize: number }) => {
			const skip = (args.page - 1) * args.pageSize;
			const take = skip + args.pageSize;
			const records = await client.$transaction([client.user.count(), client.user.findMany({ skip, take })]);

			return {
				page: args.page,
				pages: Math.max(Math.ceil(records[0] / args.pageSize), 1),
				records: records[1]
			};
		},
		createUser: async (args: Prisma.UserCreateArgs['data']) => {
			const { error, data } = await tryCatch(client.user.create({ data: { name: args.name, email: args.email } }));

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
