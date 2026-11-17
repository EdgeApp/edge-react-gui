/**
 * What a thrown value says, whatever it is.
 *
 * One place, so a change to how a non-`Error` throw is rendered — a
 * cleaner's `TypeError` chain, an `AggregateError` — is one edit.
 *
 * Here rather than in `src/cli/engine/errors.ts`, because the modules the
 * GUI and the CLI share need it too and must not import the engine's error
 * contract to get it. `errors.ts` re-exports it for the engine's call sites.
 *
 * Node-safe: no react-native, no Redux, no Airship.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
