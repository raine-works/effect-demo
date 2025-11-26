type Success<T> = {
	data: T;
	error: null;
};

type Failure<E> = {
	data: null;
	error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

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
export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
	try {
		const data = await promise;
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
}
