import { tryCatch } from '@effect-demo/tools/lib/tryCatch';
import { ORPCError } from '@orpc/server';
import { contractClient } from '@server/lib/contract';
import { base, privateProcedure } from '@server/lib/orpc';
import { z } from 'zod';

export const mathRouter = base.router({
	doMath: privateProcedure
		.input(z.object({ value: z.number() }))
		.output(z.object({ value: z.number() }))
		.route({ method: 'POST', path: '/math' })
		.handler(async ({ input, signal }) => {
			const { error, data } = await tryCatch(contractClient.multiplyByTwo({ value: input.value }, { signal }));

			if (error) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: error });
			}

			return data;
		})
});
