type ErrorCodes = 'P2002';

export class CustomError extends Error {
	code: ErrorCodes;
	id: string;
	constructor(options: { message?: string; code: ErrorCodes; cause?: Error }) {
		super(options.message, { cause: options.cause });
		this.name = this.constructor.name;
		this.code = options.code;
		this.id = Bun.randomUUIDv7();
	}
}

type Success<T> = {
	data: T;
	error: null;
};

type Failure<E> = {
	data: null;
	error: E;
};

type Result<T, E = CustomError> = Success<T> | Failure<E>;

/**
 * Property to handle try-catch in async functions.
 * Returns a Result type with either data or error.
 * @param promise The promise to handle.
 * @template T The type of the data returned on success.
 * @template E The type of the error returned on failure, defaults to Error.
 * @example
 * const result = await tryCatch(asyncFunction());
 * if (result.error) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.data);
 * }
 * @see
 * @returns
 */
export const tryCatch = async <T, E = CustomError>(promise: Promise<T>): Promise<Result<T, E>> => {
	try {
		const data = await promise;
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
};
