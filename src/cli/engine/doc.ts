/**
 * Attaches prose to a cleaner.
 *
 * `doc(asString, 'The name to normalize.')` returns the same cleaner, so it is
 * invisible at runtime and safe to wrap anything. The documentation build
 * reads these calls out of the source, which means a field's description sits
 * against the field itself rather than in a separate tag that has to repeat
 * its name to find it.
 *
 * It works on a whole cleaner too, for responses the engine passes straight
 * through from core:
 *
 *     returns: doc(asCoreValue, 'EdgeLoginMessages, keyed by loginId.')
 */
import type { Cleaner } from 'cleaners'

export function doc<T>(cleaner: Cleaner<T>, _prose: string): Cleaner<T> {
  return cleaner
}

/**
 * Path parameters carry scope, and mean the same thing on every route that
 * takes them, so they are described once here rather than per route.
 */
export const SCOPE_PARAMS: Record<string, string> = {
  sessionId:
    'From a successful login. The CLI supplies this from `session.json`, `--session`, or `EDGE_CLI_SESSION`.',
  walletId:
    'A full base58 wallet id or a unique prefix. An ambiguous prefix returns `409 AMBIGUOUS_WALLET_ID` with `details.candidates`.',
  objectId: 'An ephemeral object handle id.',
  pendingId: 'The `pendingId` returned when the QR login was requested.'
}
