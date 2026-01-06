import { tryCatch } from '@effect-demo/tools/lib/tryCatch';
import { ORPCError } from '@orpc/server';
import { base, privateProcedure, publicProcedure } from '@server/lib/orpc';
import { z } from 'zod';

export const userRouter = base.router({
	getAllUsers: privateProcedure
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
		.route({ method: 'GET', path: '/user' })
		.handler(async ({ input, context, signal }) => {
			const { error, data } = await tryCatch(
				context.db.handlers.user.getAllUsers({ page: input.page, pageSize: input.pageSize }, signal)
			);

			if (error) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: error });
			}

			return data;
		}),

	createUser: publicProcedure
		.input(z.object({ name: z.string(), email: z.email() }))
		.output(z.object({ id: z.uuid(), name: z.string(), email: z.email(), image: z.url().nullable() }))
		.errors({
			BAD_REQUEST: {
				message: 'User already exists.',
				data: z.object({
					field: z.string(),
					value: z.string()
				})
			}
		})
		.route({ method: 'POST', path: '/user' })
		.handler(async ({ input, context, errors, signal }) => {
			const { error, data } = await tryCatch(
				context.db.handlers.user.createUser({ name: input.name, email: input.email }, signal)
			);

			if (error) {
				if (error.code === 'P2002') {
					throw errors.BAD_REQUEST({
						data: { field: 'email', value: input.email }
					});
				}

				throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: error });
			}

			return {
				id: data.id,
				name: data.name,
				email: data.email,
				image: data.image
			};
		}),

	createUserSubscription: privateProcedure.route({ method: 'GET', path: '/user/sub' }).handler(async function* ({
		context
	}) {
		const stream = context.bp.broadcast.$stream<Awaited<ReturnType<typeof context.db.handlers.user.createUser>>>();

		for await (const data of stream) {
			yield data;
		}
	})
});
