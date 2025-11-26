import { tryCatch } from '@effect-demo/tools/utils/tryCatch';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod/mini';

export const userRoute = new Hono()
	.get('/', async (c) => {
		const { error, data } = await tryCatch(c.var.db.handlers.user.getAllUsers());

		if (error) {
			c.status(500);
			return c.json(error);
		}

		return c.json(data);
	})
	.post(
		'/',
		zValidator(
			'json',
			z.object({
				name: z.string(),
				email: z.email()
			})
		),
		async (c) => {
			const { name, email } = c.req.valid('json');
			const { error, data } = await tryCatch(c.var.db.handlers.user.createUser({ name, email }));

			if (error) {
				c.status(500);
				return c.json(error);
			}

			return c.json(data);
		}
	);
