import http2 from 'node:http2';
import type { ConnectRouter } from '@connectrpc/connect';
import { connectNodeAdapter } from '@connectrpc/connect-node';
import { DoThingService, type ThingRequest } from '@effect-demo/contracts';

const handler = connectNodeAdapter({
	routes: (router: ConnectRouter) => {
		router.service(DoThingService, {
			async multiplyByTwo(req: ThingRequest, { signal }) {
				await Bun.sleep(120000);
				console.log(signal.aborted);
				const value = req.value * 2;
				return { value };
			}
		});
	}
});

http2.createServer(handler).listen(8080);
