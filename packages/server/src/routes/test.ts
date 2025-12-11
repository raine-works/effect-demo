import { base } from '@server/orpc';
import { z } from 'zod';

const one = base
	.route({ method: 'POST', path: '/test/one' })
	.input(z.object({ name: z.string() }))
	.output(z.object({ message: z.string() }))
	.handler(async ({ input }) => ({ message: `Hello, ${input.name}!` }));

const two = base
	.route({ method: 'POST', path: '/test/two' })
	.input(z.object({ name: z.string() }))
	.output(z.object({ message: z.string() }))
	.handler(async ({ input }) => ({ message: `Hello, ${input.name}!` }));

export const testRouter = { one, two };
