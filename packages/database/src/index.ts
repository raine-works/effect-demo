import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@/database/generated/client';
import { userHandler } from '@/database/handlers/user';
import { cancellableTransactionExtension } from '@/database/lib/cancellableTransaction';

const _inferenceHelper = () => (null as unknown as PrismaClient).$extends(cancellableTransactionExtension);
export type ExtendedPrismaClient = ReturnType<typeof _inferenceHelper>;

export const database = (connectionString: string) => {
	const adapter = new PrismaPg({ connectionString });
	const client = new PrismaClient({ adapter }).$extends(cancellableTransactionExtension);

	return {
		client,
		handlers: {
			user: userHandler(client)
		}
	};
};

export { Prisma };
