import { EventEmitter, on } from 'node:events';
import { Prisma } from '@database/generated/client';
import { tryCatch } from '@effect-demo/tools';

const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(0);

type Operation =
	| 'create'
	| 'createMany'
	| 'createManyAndReturn'
	| 'update'
	| 'updateMany'
	| 'updateManyAndReturn'
	| 'delete'
	| 'deleteMany';

type ModelEvents = {
	[K in Prisma.ModelName]: `${K}:${Operation}`;
}[Prisma.ModelName];

type InferPayload<K extends string> = K extends `${infer M}:${infer Op}`
	? M extends keyof Prisma.TypeMap['model']
		? // 1. Singular Ops -> Return the Object
			Op extends 'create' | 'update' | 'delete'
			? Prisma.TypeMap['model'][M]['payload']['scalars']
			: // 2. Batch Return Ops -> Return Array of Objects
				Op extends 'createManyAndReturn' | 'updateManyAndReturn'
				? Prisma.TypeMap['model'][M]['payload']['scalars'][]
				: // 3. Batch Count Ops -> Return Count
					Op extends 'createMany' | 'updateMany' | 'deleteMany'
					? Prisma.BatchPayload
					: never
		: never
	: never;

export const subscribeExtension = Prisma.defineExtension((client) => {
	return client.$extends({
		name: 'subscribe',
		client: {
			$subscribe<K extends ModelEvents>(key: K, signal?: AbortSignal): AsyncIterableIterator<InferPayload<K>> {
				console.log(`Subscribed to ${key} events.`);
				const iterator = async function* () {
					const stream = tryCatch(on(eventEmitter, key, { signal }));

					for await (const { error, data } of stream) {
						if (error) {
							if (error.code !== 'ABORT_ERR') {
								console.error('Stream died:', error);
							}
							break;
						}

						yield data[0] as InferPayload<K>;
					}
				};

				return iterator();
			}
		},
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					const data = await query(args);

					const targetOps: Operation[] = [
						'create',
						'createMany',
						'createManyAndReturn',
						'update',
						'updateMany',
						'updateManyAndReturn',
						'delete',
						'deleteMany'
					];

					if ((targetOps as string[]).includes(operation)) {
						const key = `${model}:${operation}`;
						eventEmitter.emit(key, { event: key, data });
					}

					return data;
				}
			}
		}
	});
});
