import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['test', 'development', 'production']),
	LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('trace'),
	TZ: z.string(),
	DATABASE_URL: z.url(),
	PORT: z.string().default('8080')
});

export const env = envSchema.parse(Bun.env);
