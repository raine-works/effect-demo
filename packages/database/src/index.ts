import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/database/generated/client';

export const database = (connectionString: string) => {
	const adapter = new PrismaPg({ connectionString });
	return new PrismaClient({ adapter });
};
