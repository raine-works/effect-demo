import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as BunContext from '@effect/platform-bun/BunContext';
import * as BunRuntime from '@effect/platform-bun/BunRuntime';
import * as BunPgMigrator from '@effect-demo/sql-bun/migrator';
import * as Effect from 'effect/Effect';
import { PgLive } from '@/database/index';

BunRuntime.runMain(
	Effect.gen(function* () {
		const migrations = yield* BunPgMigrator.runMigration({
			loader: BunPgMigrator.fromFileSystem(path.join(fileURLToPath(new URL('.', import.meta.url)), '../migrations')),
			schemaDirectory: path.join(fileURLToPath(new URL('.', import.meta.url)), '../migrations/sql')
		});

		if (migrations.length === 0) {
			yield* Effect.log('No new migrations to run.');
		} else {
			yield* Effect.log('Migrations applied:');
			for (const [id, name] of migrations) {
				yield* Effect.log(`- ${id.toString().padStart(4, '0')}_${name}`);
			}
		}
	}).pipe(Effect.provide([BunContext.layer, PgLive]))
);
