import type { Result } from "./types";

export async function safe<T>(promise: Promise<T>): Promise<Result<T>> {
  return promise
    .then((value) => ({ ok: true as const, value }))
    .catch((error) => ({ ok: false as const, error }));
}
