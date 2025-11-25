import { database } from '@effect-demo/database';
import { env } from 'bun';

const db = database(env.DATABASE_URL);

await db.$connect();

console.log(await db.user.count());

await db.$disconnect();
