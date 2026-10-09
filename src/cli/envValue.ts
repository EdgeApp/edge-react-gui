/**
 * An environment variable that is set but blank is as good as unset.
 *
 * One copy: the client read `EDGE_CLI_SESSION` and the engine
 * `EDGE_CLI_API_KEY` through byte-identical local helpers, and the empty
 * string is a state both of them have to get right. `''` is not nullish, so
 * a blank value shadowed the thing it was meant to override — for the
 * session, `needsSession` tested `== null`, passed, and every account
 * command then built `/account//…`, a path the router cannot match, so they
 * answered NOT_FOUND with a perfectly good `session.json` left unread.
 *
 * A variable exported empty, or set from a command substitution that
 * produced nothing, is the ordinary way that happens.
 */
export function emptyToUndefined(
  value: string | undefined
): string | undefined {
  return value == null || value === '' ? undefined : value
}
