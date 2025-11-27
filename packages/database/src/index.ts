import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@/database/generated/client';
import { userHandler } from '@/database/handlers/user';
import { AbortableClient } from '@/database/lib/abortableClient';

export const database = (connectionString: string) => {
	const adapter = new PrismaPg({ connectionString });
	const client = new PrismaClient({ adapter });
	const abortable = new AbortableClient(client);

	return {
		client,
		handlers: {
			user: userHandler(abortable)
		}
	};
};

export { Prisma };
