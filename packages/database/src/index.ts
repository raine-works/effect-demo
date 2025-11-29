import { Prisma, PrismaClient } from '@database/generated/client';
import { userHandler } from '@database/handlers/user';
import { cancellableTransactionExtension } from '@database/lib/cancellableTransaction';
import { PrismaPg } from '@prisma/adapter-pg';

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

export type * from '@database/generated/browser';
export type * from '@database/generated/commonInputTypes';
export type * from '@database/generated/enums';
export type * from '@database/generated/models';
