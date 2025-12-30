import { type ConnectionOptions, connect, JSONCodec, type NatsError, StringCodec } from 'nats';

export const backplane = async (args: { servers: ConnectionOptions['servers']; user: string; pass: string }) => {
	const client = await connect({ ...args, maxReconnectAttempts: 10 });
	const stringCodec = StringCodec();
	const jsonCodec = JSONCodec();

	return {
		client,
		stringCodec,
		jsonCodec,
		$disconnect: async () => {
			await Bun.sleep(1000);
			await client.drain();
			await client.close();
		},
		broadcast: {
			$publish: (msg: object) => {
				return client.publish('global:event', jsonCodec.encode(msg));
			},
			$subscribe: <T>(fn: (err: NatsError | null, decodedMsg: T) => void) => {
				return client.subscribe('global:event', {
					callback: (err, msg) => {
						const decodedMsg = jsonCodec.decode(msg.data) as T;
						return fn(err, decodedMsg);
					}
				});
			},
			$stream: async function* <T>() {
				const sub = client.subscribe('global:event');
				for await (const msg of sub) {
					const decodedMsg = jsonCodec.decode(msg.data) as T;
					yield decodedMsg;
				}
			}
		}
	};
};
