/**
 * What a thrown value says, whatever it is.
 *
 * `error instanceof Error ? error.message : String(error)` was written out
 * fifty times across `src/cli` and `scripts` — four times in `server.ts`
 * alone — against thirty-two occurrences in the whole of `src` before this
 * CLI existed. One place, so a change to how a non-`Error` throw is rendered
 * — a cleaner's `TypeError` chain, an `AggregateError` — is one edit.
 *
 * Here rather than in `src/cli/engine/errors.ts`, where it started, because
 * the shared GUI/CLI modules this branch extracted need it too and must not
 * import the engine's error contract to get it. `errors.ts` re-exports it, so
 * every engine call site is unchanged.
 *
 * Node-safe: no react-native, no Redux, no Airship.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
