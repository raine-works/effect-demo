import { tryCatch } from '@effect-demo/tools';
import { ORPCError } from '@orpc/server';
import { privateProcedure } from '@server/lib/orpc';
import { z } from 'zod';

const getAllUsers = privateProcedure
	.route({ method: 'GET', path: '/users' })
	.input(
		z.object({ page: z.coerce.number().positive().default(1), pageSize: z.coerce.number().positive().default(30) })
	)
	.output(
		z.object({
			page: z.number(),
			pages: z.number(),
			records: z.array(
				z.object({
					id: z.string(),
					name: z.string().nullable(),
					email: z.string(),
					createdAt: z.date(),
					updatedAt: z.date()
				})
			)
		})
	)
	.handler(async ({ input, context, signal }) => {
		const { error, data } = await tryCatch(
			context.db.handlers.user.getAllUsers({ page: input.page, pageSize: input.pageSize }, signal)
		);

		if (error) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: error });
		}

		return data;
	});

export const userRouter = { getAllUsers };
