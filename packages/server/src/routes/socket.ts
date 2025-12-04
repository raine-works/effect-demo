import type { HonoEnv } from '@server/index';
import { type Context, Hono } from 'hono';
import { upgradeWebSocket } from 'hono/bun';

export const socketRoute = new Hono<HonoEnv>().get(
	'/subscribe',
	upgradeWebSocket((c: Context<HonoEnv>) => {
		return {
			async onOpen(_event, ws) {
				const stream = c.var.db.client.$subscribe('User:create', c.req.raw.signal);

				for await (const data of stream) {
					if (ws.readyState === 1) {
						ws.send(JSON.stringify(data));
					}
				}
			},
			onClose: () => {
				console.log('Connection closed');
			}
		};
	})
);
