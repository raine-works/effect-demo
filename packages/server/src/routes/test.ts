import { os } from '@orpc/server';
import { z } from 'zod';

const test1 = os
	.input(z.object({ name: z.string() }))
	.output(z.object({ message: z.string() }))
	.handler(async ({ input }) => ({ message: `Hello, ${input.name}!` }));

const test2 = os
	.input(z.object({ name: z.string() }))
	.output(z.object({ message: z.string() }))
	.handler(async ({ input }) => ({ message: `Hello, ${input.name}!` }));

export const router = { test1, test2 };
