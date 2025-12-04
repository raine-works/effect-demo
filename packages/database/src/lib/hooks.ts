import { Prisma } from '@database/generated/client';

export const hooksExtension = Prisma.defineExtension((client) => {
	return client.$extends({
		name: 'hooks'
	});
});
