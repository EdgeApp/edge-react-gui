/**
 * An environment variable that is set but blank is as good as unset.
 *
 * The client and the engine both read their variables, such as
 * `EDGE_CLI_SESSION` and `EDGE_CLI_API_KEY`, through this one copy, and the
 * empty string is a state every one of them has to get right. `''` is not
 * nullish, so a blank value read as is would shadow the thing it is meant to
 * override: for the session, `requireSession` tests `== null` and would
 * pass, and every account command would build `/account//…`, a path the
 * router cannot match, and answer NOT_FOUND with a good `session.json` left
 * unread.
 *
 * A variable exported empty, or set from a command substitution that
 * produced nothing, is the ordinary way that happens.
 */
export function emptyToUndefined(
  value: string | undefined
): string | undefined {
  return value == null || value === '' ? undefined : value
}
