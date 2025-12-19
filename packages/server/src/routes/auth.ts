import { tryCatch } from '@effect-demo/tools/lib/tryCatch';
import { ORPCError } from '@orpc/server';
import { generateAccessToken, generateRefreshToken, type RefreshJWT } from '@server/lib/auth';
import { env } from '@server/lib/env';
import { base, publicProcedure } from '@server/lib/orpc';
import { jwtVerify } from 'jose';
import { z } from 'zod';

export const authContract = base.router({
	login: publicProcedure
		.input(
			z.object({
				email: z.email()
			})
		)
		.output(z.object({ accessToken: z.string(), refreshToken: z.string() }))
		.route({ method: 'POST', path: '/auth/login' })
		.handler(async ({ input, context, signal }) => {
			console.log(input);
			const user = await tryCatch(context.db.handlers.user.getUserByEmail({ email: input.email }, signal));

			if (user.error) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: user.error, message: user.error.message });
			}

			if (!user.data) {
				throw new ORPCError('NOT_FOUND', { message: `No user with the email: ${input.email}.` });
			}

			const session = await tryCatch(
				context.db.handlers.session.createSession(
					{
						userId: user.data.id,
						userAgent: context.headers.get('User-Agent'),
						ipAddress: context.headers.get('X-Forwarded-For'),
						expiresAt: new Date(context.temporal.Now.plainDateTimeISO().add({ days: 7 }).toString())
					},
					signal
				)
			);

			if (session.error) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: session.error, message: session.error.message });
			}

			const accessToken = await generateAccessToken(user.data, session.data);
			const refreshToken = await generateRefreshToken(user.data.id, session.data.id);

			return { accessToken, refreshToken };
		}),

	refresh: publicProcedure
		.input(z.object({ refreshToken: z.string() }))
		.output(z.object({ accessToken: z.string() }))
		.route({ method: 'POST', path: '/auth/refresh' })
		.handler(async ({ input, context, signal }) => {
			const secret = new TextEncoder().encode(env.JWT_SECRET);
			const { error, data } = await tryCatch(jwtVerify<RefreshJWT>(input.refreshToken, secret));

			if (error) {
				throw new ORPCError('UNAUTHORIZED', { message: error.message });
			}

			const session = await tryCatch(context.db.handlers.session.getSession({ id: data.payload.sessionId }, signal));

			if (session.error) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: session.error, message: session.error.message });
			}

			if (!session.data) {
				throw new ORPCError('UNAUTHORIZED');
			}

			const user = await tryCatch(context.db.handlers.user.getUserById({ id: session.data.userId }, signal));

			if (user.error) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: user.error, message: user.error.message });
			}

			if (!user.data) {
				throw new ORPCError('NOT_FOUND', { message: 'User not found.' });
			}

			const accessToken = await generateAccessToken(user.data, session.data);

			return { accessToken };
		})
});
