import type { Prisma } from '@effect-demo/database';
import { tryCatch } from '@effect-demo/tools';
import { ORPCError } from '@orpc/server';
import { env } from '@server/lib/env';
import { publicProcedure } from '@server/lib/orpc';
import { SignJWT } from 'jose';
import { z } from 'zod';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const alg = 'HS256';

const generateAccessToken = async (user: Prisma.UserGetPayload<{}>) => {
	return await new SignJWT({ sub: user.id, type: 'access', user })
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setExpirationTime('10m')
		.sign(secret);
};

const generateRefreshToken = async (session: Prisma.SessionGetPayload<{}>) => {
	return await new SignJWT({ sub: session.userId, type: 'refresh', session })
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setExpirationTime('7d')
		.setJti(Bun.randomUUIDv7())
		.sign(secret);
};

const login = publicProcedure
	.route({ method: 'POST', path: '/auth/login' })
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
			throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: user.error });
		}

		if (!user.data) {
			throw new ORPCError('NOT_FOUND', { message: `No user with the email: ${input.email}.` });
		}

		const session = await tryCatch(
			context.db.handlers.session.createSession({ userId: user.data.id, expiresAt: dateInOneWeek }, signal)
		);

		if (session.error) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', { cause: session.error });
		}

		const accessToken = await generateAccessToken(user.data);
		const refreshToken = await generateRefreshToken(session.data);

		return { accessToken, refreshToken };
	});

export const authRouter = { login };
