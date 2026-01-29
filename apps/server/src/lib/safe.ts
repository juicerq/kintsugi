import type { Result } from "./types";

export async function safe<T>(promise: Promise<T>): Promise<Result<T, unknown>> {
	return promise
		.then((value) => ({ ok: true as const, value }))
		.catch((error) => ({ ok: false as const, error }));
}

export function safeSync<T>(fn: () => T): Result<T, unknown> {
	try {
		return { ok: true, value: fn() };
	} catch (error) {
		return { ok: false, error };
	}
}

type WithErrorHandlerOptions = {
	rethrowOnly?: (error: unknown) => boolean;
};

export async function withErrorHandler<T>(
	fn: () => Promise<T>,
	onError: (error: Error) => void | Promise<void>,
	options?: WithErrorHandlerOptions,
): Promise<T> {
	const result = await safe(fn());

	if (!result.ok) {
		const error =
			result.error instanceof Error
				? result.error
				: new Error(String(result.error));

		if (options?.rethrowOnly?.(result.error)) {
			throw error;
		}

		await onError(error);

		throw error;
	}

	return result.value;
}

export const withErrorLog = withErrorHandler;
