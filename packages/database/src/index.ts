import { Prisma, PrismaClient } from '@database/generated/client';
import { userHandler } from '@database/handlers/user';
import { cancellableExtension } from '@database/lib/cancellable';
import { hooksExtension } from '@database/lib/hooks';
import type { InferPayload, ModelEvents } from '@database/lib/subscribe';
import { subscribeExtension } from '@database/lib/subscribe';
import { PrismaPg } from '@prisma/adapter-pg';

const _inferenceHelper = () =>
	(null as unknown as PrismaClient)
		.$extends(hooksExtension)
		.$extends(subscribeExtension)
		.$extends(cancellableExtension);
export type ExtendedPrismaClient = ReturnType<typeof _inferenceHelper>;

export const database = (connectionString: string) => {
	const adapter = new PrismaPg({ connectionString });
	const client = new PrismaClient({ adapter })
		.$extends(hooksExtension)
		.$extends(subscribeExtension)
		.$extends(cancellableExtension);

	return {
		client,
		handlers: {
			user: userHandler(client)
		}
	};
};

export { Prisma };
export type { InferPayload, ModelEvents };

export type * from '@database/generated/browser';
export type * from '@database/generated/commonInputTypes';
export type * from '@database/generated/enums';
export type * from '@database/generated/models';
