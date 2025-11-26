import type { PrismaClient } from '@/database/generated/client';

export const useUser = (client: PrismaClient) => {
	return {
		getAllUsers: async () => {
			return await client.user.findMany();
		}
	};
};
