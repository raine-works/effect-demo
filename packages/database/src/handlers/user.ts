import type { Prisma, PrismaClient } from '@/database/generated/client';

export const useUser = (client: PrismaClient) => {
	return {
		getAllUsers: async () => {
			return await client.user.findMany();
		},
		createUser: async (args: Prisma.UserCreateArgs['data']) => {
			return await client.user.create({ data: { name: args.name, email: args.email } });
		}
	};
};
