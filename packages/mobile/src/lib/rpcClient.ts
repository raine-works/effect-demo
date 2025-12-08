import type { Router } from '@effect-demo/server';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';

const link = new RPCLink({
	url: 'http://localhost:3000/rpc'
});

export const client: RouterClient<Router> = createORPCClient(link);
