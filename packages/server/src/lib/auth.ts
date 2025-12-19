import { tryCatch } from '@effect-demo/tools/lib/tryCatch';
import { ORPCError, os } from '@orpc/server';
import { env } from '@server/lib/env';
import type { Context } from '@server/lib/orpc';
import { jwtVerify, SignJWT } from 'jose';

export type SessionJWT = {
	sub: string;
	type: 'access';
	user: NonNullable<Context['user']>;
	session: NonNullable<Context['session']>;
};
export type RefreshJWT = { sub: string; type: 'refresh'; sessionId: string };

const secret = new TextEncoder().encode(env.JWT_SECRET);
const alg = 'HS256';

export const generateAccessToken = async (
	user: NonNullable<Context['user']>,
	session: NonNullable<Context['session']>
) => {
	return await new SignJWT({ sub: user.id, type: 'access', user, session } satisfies SessionJWT)
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setExpirationTime('10m')
		.sign(secret);
};

export const generateRefreshToken = async (userId: string, sessionId: string) => {
	return await new SignJWT({ sub: userId, type: 'refresh', sessionId } satisfies RefreshJWT)
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setExpirationTime('7d')
		.setJti(Bun.randomUUIDv7())
		.sign(secret);
};

export const authMiddleware = os.$context<Context>().middleware(async ({ context, next }) => {
	const bearerToken = context.headers.get('Authorization')?.split(' ')[1];

	if (!bearerToken) {
		throw new ORPCError('UNAUTHORIZED');
	}

	const { error, data } = await tryCatch(jwtVerify<SessionJWT>(bearerToken, secret));

	if (error) {
		throw new ORPCError('UNAUTHORIZED', { message: 'Token expired.' });
	}

	return next({
		context: { user: data.payload.user, session: data.payload.session } as Context
	});
});
