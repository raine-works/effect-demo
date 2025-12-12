import { env } from '@server/lib/env';
import { publicProcedure } from '@server/lib/orpc';
import { SignJWT } from 'jose';
import { z } from 'zod';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const alg = 'HS256';

const login = publicProcedure
	.route({ method: 'POST', path: '/auth/login' })
	.input(
		z.object({
			email: z.email()
		})
	)
	.output(z.object({ token: z.string() }))
	.handler(async ({ input }) => {
		const token = await new SignJWT({
			user: { email: input.email },
			session: { expires: new Date() }
		})
			.setProtectedHeader({ alg })
			.setIssuedAt()
			.setExpirationTime('2m')
			.sign(secret);

		return { token };
	});

export const authRouter = { login };
