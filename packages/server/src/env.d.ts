import type { database } from '@effect-demo/database';

declare module 'hono' {
	interface ContextVariableMap {
		db: ReturnType<typeof database>;
	}
}
