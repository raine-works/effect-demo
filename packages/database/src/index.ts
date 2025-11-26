import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@/database/generated/client';
import { userHandler } from '@/database/handlers/user';

export const database = (connectionString: string) => {
	const adapter = new PrismaPg({ connectionString });
	const client = new PrismaClient({ adapter });

	return {
		client,
		handlers: {
			user: userHandler(client)
		}
	};
};

export { Prisma };
