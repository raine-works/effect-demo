import type { Api } from '@effect-demo/server';
import { hc } from 'hono/client';

export const client = hc<Api>(`http://10.0.0.94:3000/`);
