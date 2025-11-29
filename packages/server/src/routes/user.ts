import { tryCatch } from '@effect-demo/tools';
import { zValidator } from '@hono/zod-validator';
import type { HonoEnv } from '@server/index';
import { Hono } from 'hono';
import { z } from 'zod';

export const userRoute = new Hono<HonoEnv>()
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
			const { error, data } = await tryCatch(
				c.var.db.handlers.user.getAllUsers(c.req.valid('query'), c.req.raw.signal)
			);

			if (error) {
				return c.json({ error: { id: error.id, code: error.code, message: error.message } }, 500);
			}

			return c.json(data, 200);
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
			const { error, data } = await tryCatch(c.var.db.handlers.user.createUser(c.req.valid('json'), c.req.raw.signal));

			if (error) {
				return c.json(
					{ error: { id: error.id, code: error.code, message: error.message } },
					error.code === 'P2002' ? 400 : 500
				);
			}

			return c.json(data, 201);
		}
	);
