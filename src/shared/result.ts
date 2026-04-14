/**
 * Go-style result tuple: [value, null] on success, [null, error] on failure.
 *
 * Usage:
 *   const [user, err] = await getUser(id, deps);
 *   if (err) { ... handle error ... }
 *   // user is narrowed to T here
 */
export type Result<T, E = Error> = [T, null] | [null, E];

export const ok = <T>(value: T): [T, null] => [value, null];
export const err = <E>(error: E): [null, E] => [null, error];
