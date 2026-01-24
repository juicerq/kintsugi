export type Maybe<T> = T | null;

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
