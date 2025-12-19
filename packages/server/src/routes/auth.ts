import { tryCatch } from '@effect-demo/tools/lib/tryCatch';
import { ORPCError } from '@orpc/server';
import { generateAccessToken, generateRefreshToken, type RefreshJWT } from '@server/lib/auth';
import { env } from '@server/lib/env';
import { publicProcedure } from '@server/lib/orpc';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const login = publicProcedure
	.input(
		z.object({
			email: z.email()
		})
	)
	.output(z.object({ accessToken: z.string(), refreshToken: z.string() }))
	.handler(async ({ input, context, signal }) => {
		const today = new Date();
		const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
		const dateInOneWeek = new Date(today.getTime() + sevenDaysInMs);

		const user = await tryCatch(context.db.handlers.user.getUserByEmail({ email: input.email }, signal));

		if (user.error) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: user.error, message: user.error.message });
		}

		if (!user.data) {
			throw new ORPCError('NOT_FOUND', { message: `No user with the email: ${input.email}.` });
		}

		const session = await tryCatch(
			context.db.handlers.session.createSession({ userId: user.data.id, expiresAt: dateInOneWeek }, signal)
		);

		if (session.error) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: session.error, message: session.error.message });
		}

		const accessToken = await generateAccessToken(user.data, session.data);
		const refreshToken = await generateRefreshToken(user.data.id, session.data.id);

		return { accessToken, refreshToken };
	});

const refresh = publicProcedure
	.input(z.object({ refreshToken: z.string() }))
	.output(z.object({ accessToken: z.string() }))
	.handler(async ({ input, context, signal }) => {
		const secret = new TextEncoder().encode(env.JWT_SECRET);
		const { error, data } = await tryCatch(jwtVerify<RefreshJWT>(input.refreshToken, secret));

		if (error) {
			throw new ORPCError('UNAUTHORIZED', { message: error.message });
		}

		const sessionId = data.payload.sessionId;

		const session = await tryCatch(context.db.handlers.session.getSession({ id: sessionId }, signal));

		if (session.error || !session.data) {
			throw new ORPCError('UNAUTHORIZED');
		}

		const user = await tryCatch(context.db.handlers.user.getUserById({ id: session.data.userId }, signal));

		if (user.error || !user.data) {
			throw new ORPCError('UNAUTHORIZED');
		}

		const accessToken = await generateAccessToken(user.data, session.data);

		return { accessToken };
	});

export const authRouter = { login, refresh };
