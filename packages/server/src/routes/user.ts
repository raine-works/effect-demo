import { tryCatch } from '@effect-demo/tools/utils/tryCatch';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

export const userRoute = new Hono()
	/****************************
	 * Get all users paginated. *
	 ****************************/
	.get(
		'/',
		zValidator(
			'query',
			z.object({
				page: z.coerce.number().positive().default(1),
				pageSize: z.coerce.number().positive().default(30)
			})
		),
		async (c) => {
			const { error, data } = await tryCatch(c.var.db.handlers.user.getAllUsers(c.req.valid('query')));

			if (error) {
				c.status(500);
				return c.json({ error: { id: error.id, code: error.code, message: error.message } });
			}

			return c.json(data);
		}
	)
	/**********************
	 * Create a new user. *
	 **********************/
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
			const { error, data } = await tryCatch(c.var.db.handlers.user.createUser(c.req.valid('json')));

			if (error) {
				c.status(error.code === 'P2002' ? 400 : 500);
				return c.json({ error: { id: error.id, code: error.code, message: error.message } });
			}

			c.status(201);
			return c.json(data);
		}
	);
