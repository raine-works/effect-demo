import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import { DoThingService } from '@effect-demo/contracts';

const transport = createConnectTransport({
	baseUrl: 'http://localhost:8080',
	httpVersion: '2'
});

export const contractClient = createClient(DoThingService, transport);
