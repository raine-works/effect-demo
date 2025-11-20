/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: use effect */
import * as Reactivity from '@effect/experimental/Reactivity';
import * as Client from '@effect/sql/SqlClient';
import type { Connection } from '@effect/sql/SqlConnection';
import { SqlError } from '@effect/sql/SqlError';
import type { Custom, Fragment } from '@effect/sql/Statement';
import * as Statement from '@effect/sql/Statement';
import { SQL } from 'bun';
import * as Chunk from 'effect/Chunk';
import * as Config from 'effect/Config';
import type * as ConfigError from 'effect/ConfigError';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import type * as Scope from 'effect/Scope';
import * as Stream from 'effect/Stream';

const ATTR_DB_SYSTEM_NAME = 'db.system.name';
const ATTR_DB_NAMESPACE = 'db.namespace';
const ATTR_SERVER_ADDRESS = 'server.address';
const ATTR_SERVER_PORT = 'server.port';

export const TypeId: TypeId = '~@effect/sql-bun/BunPgClient';

export type TypeId = '~@effect/sql-bun/BunPgClient';

export interface BunPgClient extends Client.SqlClient {
	readonly [TypeId]: TypeId;
	readonly config: BunPgClientConfig;
	readonly json: (_: unknown) => Fragment;
}

export const BunPgClient = Context.GenericTag<BunPgClient>('@effect/sql-bun/BunPgClient');

export interface BunPgClientConfig {
	readonly url?: Redacted.Redacted | undefined;

	readonly host?: string | undefined;
	readonly port?: number | undefined;
	readonly database?: string | undefined;
	readonly username?: string | undefined;
	readonly password?: Redacted.Redacted | undefined;

	readonly connectTimeout?: Duration.DurationInput | undefined;

	readonly spanAttributes?: Record<string, unknown> | undefined;

	readonly transformResultNames?: ((str: string) => string) | undefined;
	readonly transformQueryNames?: ((str: string) => string) | undefined;
	readonly transformJson?: boolean | undefined;
}

export const make = (
	options: BunPgClientConfig
): Effect.Effect<BunPgClient, SqlError, Scope.Scope | Reactivity.Reactivity> =>
	Effect.gen(function* () {
		const compiler = makeCompiler(options.transformQueryNames, options.transformJson);
		const transformRows = options.transformResultNames
			? Statement.defaultTransforms(options.transformResultNames, options.transformJson).array
			: undefined;

		const sql = new SQL({
			adapter: 'postgres',
			...(options.url
				? { url: Redacted.value(options.url) }
				: {
						host: options.host,
						port: options.port,
						database: options.database,
						user: options.username,
						password: options.password ? Redacted.value(options.password) : undefined
					})
		});

		// Test connection
		yield* Effect.tryPromise({
			try: async () => {
				await sql`SELECT 1`;
			},
			catch: (cause) => new SqlError({ cause, message: 'BunPgClient: Failed to connect' })
		}).pipe(
			Effect.timeoutFail({
				duration: options.connectTimeout ?? Duration.seconds(5),
				onTimeout: () =>
					new SqlError({
						cause: new Error('Connection timed out'),
						message: 'BunPgClient: Connection timed out'
					})
			})
		);

		type QueryResult = Record<string, unknown>;

		class ConnectionImpl implements Connection {
			private async runQuery(sqlString: string, _params: ReadonlyArray<unknown>): Promise<ReadonlyArray<QueryResult>> {
				try {
					// Execute query with Bun's sql tagged template
					const results = await sql`SELECT ${sqlString} as query`;
					return Array.isArray(results) ? results : [results as QueryResult];
				} catch (error) {
					throw new SqlError({ cause: error as Error, message: 'Failed to execute statement' });
				}
			}

			execute(
				sqlString: string,
				params: ReadonlyArray<unknown>,
				transformRows: (<A extends object>(row: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
			) {
				return Effect.tryPromise({
					try: () => this.runQuery(sqlString, params),
					catch: (cause) => new SqlError({ cause, message: 'Failed to execute statement' })
				}).pipe(Effect.map((rows) => (transformRows ? transformRows(rows as unknown as ReadonlyArray<object>) : rows)));
			}

			executeRaw(sqlString: string, _params: ReadonlyArray<unknown>) {
				return Effect.tryPromise({
					try: async () => {
						return await sql`SELECT ${sqlString} as query`;
					},
					catch: (cause) => new SqlError({ cause, message: 'Failed to execute statement' })
				});
			}

			executeWithoutTransform(sqlString: string, params: ReadonlyArray<unknown>) {
				return Effect.tryPromise({
					try: () => this.runQuery(sqlString, params),
					catch: (cause) => new SqlError({ cause, message: 'Failed to execute statement' })
				});
			}

			executeValues(sqlString: string, params: ReadonlyArray<unknown>) {
				return Effect.tryPromise({
					try: () => this.runQuery(sqlString, params),
					catch: (cause) => new SqlError({ cause, message: 'Failed to execute statement' })
				}).pipe(Effect.map((rows) => rows.map((row) => Object.values(row))));
			}

			executeUnprepared(
				sqlString: string,
				params: ReadonlyArray<unknown>,
				transformRows: (<A extends object>(row: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
			) {
				return this.execute(sqlString, params, transformRows);
			}

			executeStream(
				sqlString: string,
				params: ReadonlyArray<unknown>,
				transformRows: (<A extends object>(row: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
			) {
				return Effect.tryPromise({
					try: () => this.runQuery(sqlString, params),
					catch: (cause) => new SqlError({ cause, message: 'Failed to execute statement' })
				}).pipe(
					Stream.fromEffect,
					Stream.map((rows) =>
						Chunk.unsafeFromArray(
							transformRows
								? (transformRows(rows as unknown as ReadonlyArray<object>) as unknown as ReadonlyArray<unknown>)
								: (rows as unknown as ReadonlyArray<unknown>)
						)
					)
				);
			}
		}

		const reserve = Effect.succeed(new ConnectionImpl());

		return Object.assign(
			yield* Client.make({
				acquirer: reserve,
				transactionAcquirer: reserve,
				compiler,
				spanAttributes: [
					...(options.spanAttributes ? Object.entries(options.spanAttributes) : []),
					[ATTR_DB_SYSTEM_NAME, 'postgresql'],
					[ATTR_DB_NAMESPACE, options.database ?? options.username ?? 'postgres'],
					[ATTR_SERVER_ADDRESS, options.host ?? 'localhost'],
					[ATTR_SERVER_PORT, options.port ?? 5432]
				],
				transformRows
			}) as unknown as Effect.Effect<Client.SqlClient, SqlError, Scope.Scope>,
			{
				[TypeId]: TypeId as TypeId,
				config: options,
				json: (_: unknown) => BunJson(_)
			}
		) as unknown as BunPgClient;
	});

export const layerConfig = (
	config: Config.Config.Wrap<BunPgClientConfig>
): Layer.Layer<BunPgClient | Client.SqlClient, ConfigError.ConfigError | SqlError> =>
	Layer.scopedContext(
		Config.unwrap(config).pipe(
			Effect.flatMap(make),
			Effect.map((client) => Context.make(BunPgClient, client).pipe(Context.add(Client.SqlClient, client)))
		)
	).pipe(Layer.provide(Reactivity.layer));

export const layer = (config: BunPgClientConfig): Layer.Layer<BunPgClient | Client.SqlClient, SqlError> =>
	Layer.scopedContext(
		Effect.map(make(config), (client) => Context.make(BunPgClient, client).pipe(Context.add(Client.SqlClient, client)))
	).pipe(Layer.provide(Reactivity.layer));

export const makeCompiler = (transform?: (_: string) => string, transformJson = true): Statement.Compiler => {
	const transformValue = transformJson && transform ? Statement.defaultTransforms(transform).value : undefined;

	return Statement.makeCompiler<BunCustom>({
		dialect: 'pg',
		placeholder(_) {
			return `$${_}`;
		},
		onIdentifier: transform
			? (value, withoutTransform) => (withoutTransform ? escape(value) : escape(transform(value)))
			: escape,
		onRecordUpdate(placeholders, valueAlias, valueColumns, values, returning) {
			return [
				`(values ${placeholders}) AS ${valueAlias}${valueColumns}${returning ? ` RETURNING ${returning[0]}` : ''}`,
				returning ? values.flat().concat(returning[1]) : values.flat()
			];
		},
		onCustom(type, placeholder, withoutTransform) {
			switch (type.kind) {
				case 'BunJson': {
					return [
						placeholder(undefined),
						[withoutTransform || transformValue === undefined ? type.i0 : transformValue(type.i0)]
					];
				}
			}
		}
	});
};

const escape = Statement.defaultEscape('"');

export type BunCustom = BunJson;

interface BunJson extends Custom<'BunJson', unknown> {}
const BunJson = Statement.custom<BunJson>('BunJson');
