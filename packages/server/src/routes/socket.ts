import type { InferPayload, ModelEvents } from '@effect-demo/database';
import type { HonoEnv } from '@server/index';
import { type Context, Hono } from 'hono';
import { upgradeWebSocket } from 'hono/bun';

export const socketRoute = new Hono<HonoEnv>().get(
	'/subscribe',
	upgradeWebSocket((c: Context<HonoEnv>) => {
		return {
			async onOpen(_event, ws) {
				c.var.bp.client.subscribe('User:create' as ModelEvents, {
					callback: (_err, msg) => {
						const data = c.var.bp.jsonCodec.decode(msg.data) as InferPayload<'User:create'>;
						if (ws.readyState === 1) {
							ws.send(JSON.stringify(data));
						}
					}
				});
			},
			onClose: () => {
				console.log('Connection closed');
			}
		};
	})
);
