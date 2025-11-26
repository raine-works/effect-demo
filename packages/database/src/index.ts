import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/database/generated/client';
import { useUser } from './handlers/user';

export const database = (connectionString: string) => {
	const adapter = new PrismaPg({ connectionString });
	const client = new PrismaClient({ adapter });

	return {
		client,
		handlers: {
			user: useUser(client)
		}
	};
};
