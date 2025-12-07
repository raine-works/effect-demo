import { EventEmitter, on } from 'node:events';
import { Prisma } from '@database/generated/client';
import { tryCatch } from '@effect-demo/tools';
import type { Operation } from '@prisma/client/runtime/client';

const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(0);

type TargertOps = Extract<
	Operation,
	| 'create'
	| 'createMany'
	| 'createManyAndReturn'
	| 'update'
	| 'updateMany'
	| 'updateManyAndReturn'
	| 'delete'
	| 'deleteMany'
>;

export type ModelEvents = {
	[K in Prisma.ModelName]: `${K}:${TargertOps}`;
}[Prisma.ModelName];

export type InferPayload<K extends string> = K extends `${infer M}:${infer Op}`
	? M extends keyof Prisma.TypeMap['model']
		? Op extends 'create' | 'update' | 'delete'
			? Prisma.TypeMap['model'][M]['payload']['scalars']
			: Op extends 'createManyAndReturn' | 'updateManyAndReturn'
				? Prisma.TypeMap['model'][M]['payload']['scalars'][]
				: Op extends 'createMany' | 'updateMany' | 'deleteMany'
					? Prisma.BatchPayload
					: never
		: never
	: never;

export const subscribeExtension = Prisma.defineExtension((client) => {
	return client.$extends({
		name: 'subscribe',
		client: {
			async $subscribe<K extends ModelEvents>(
				key: K,
				onMessage: (data: InferPayload<K>) => void,
				signal?: AbortSignal
			): Promise<void> {
				const stream = tryCatch(on(eventEmitter, key, { signal }));

				for await (const { error, data } of stream) {
					if (error) {
						if (error.code !== 'ABORT_ERR') {
							console.error('Stream died:', error);
						}
						break;
					}
					onMessage(data[0] as InferPayload<K>);
				}
			}
		},
		query: {
			$allModels: {
				async $allOperations({ model, operation, args, query }) {
					const data = await query(args);

					const targetOps: TargertOps[] = [
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
						eventEmitter.emit(key, data);
					}

					return data;
				}
			}
		}
	});
});
