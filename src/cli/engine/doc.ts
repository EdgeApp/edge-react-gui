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
 *
 * Every one of these is base58, which is the rule for a path parameter: no
 * `/`, `?` or `#`, so it survives a URL without percent-encoding. Anything
 * else — a base64 wallet id, a free-text username — travels in the query or
 * the body instead.
 */
export const SCOPE_PARAMS: Record<string, string> = {
  sessionId:
    'From a successful login. The CLI supplies this from `session.json`, `--session`, or `EDGE_CLI_SESSION`.',
  objectId: 'An ephemeral object handle id.',
  pendingId: 'The `pendingId` returned when the QR login was requested.',
  shareId: 'The `shareId` returned when the wallet share was started.',
  lobbyId: 'The lobby to act on.',
  syncKey: 'Base58 sync key for the repo.'
}
