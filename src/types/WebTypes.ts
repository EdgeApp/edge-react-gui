/**
 * A set of query parameters to pass to a plugin.
 */
export interface UriQueryMap {
  // Use a string for key/value queries, like `?foo=bar`
  // Use null for key-only queries, like `?baz`
  [key: string]: string | null
}
