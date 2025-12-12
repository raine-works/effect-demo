import { tryCatch } from '@effect-demo/tools';
import { ORPCError, os } from '@orpc/server';
import { env } from '@server/lib/env';
import type { Context } from '@server/lib/orpc';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type User = {
	email: string;
};

export type Session = {
	expires: Date;
};

export const authMiddleware = os.$context<Context>().middleware(async ({ context, next }) => {
	const authHeader = context.headers.get('Authorization');
	const token = authHeader?.split(' ')[1];

	if (!token) {
		throw new ORPCError('UNAUTHORIZED');
	}

	const { error, data } = await tryCatch(jwtVerify<Context['auth']>(token, secret));

	if (error) {
		throw new ORPCError('UNAUTHORIZED');
	}

	return next({ context: { auth: data.payload } as Context });
});
