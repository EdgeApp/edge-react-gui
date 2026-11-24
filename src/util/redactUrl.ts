import URL from 'url-parse'

/**
 * Query parameters whose value proves an order belongs to the account, such
 * as the `externalTransactionId` a MoonPay sell widget opens with, or logs
 * the user in, such as the `session` token a DFX sell opens with. Release
 * builds write `console.log` to the log file users export or send to Edge,
 * so these never go there in the clear.
 */
const SECRET_QUERY_PARAMS = ['externalTransactionId', 'session']

/**
 * A raw `name=value` pair after its `?`, `&` or `;` separator. The value
 * runs up to the next `&`.
 */
const QUERY_PAIR = /([?&;])([^=&;#]*)=[^&]*/g

/** Hide a matched pair's value when its decoded name is secret. */
const redactPair = (pair: string, separator: string, name: string): string => {
  let decoded: string
  try {
    decoded = decodeURIComponent(name).toLowerCase()
  } catch {
    decoded = name.toLowerCase()
  }
  const isSecret = SECRET_QUERY_PARAMS.some(
    secret => secret.toLowerCase() === decoded
  )
  return isSecret ? `${separator}${name}=redacted` : pair
}

/**
 * Hide every secret value in the raw query text, from the first `?` up to
 * the next `#`, with the name in any letter case, percent-encoded or not.
 * When that `?` is inside the fragment, the fragment text after it is
 * checked, which fails closed.
 */
const redactRawQuery = (url: string): string => {
  const start = url.indexOf('?')
  if (start < 0) return url
  const hash = url.indexOf('#', start)
  const end = hash < 0 ? url.length : hash
  const query = url.slice(start, end).replace(QUERY_PAIR, redactPair)
  return url.slice(0, start) + query + url.slice(end)
}

/**
 * Return `url` with each secret query parameter's value hidden, for logs.
 * The parsed query is checked first. The raw query text is then checked as
 * well, because the parser skips pairs it cannot decode and matches decoded
 * names by exact case.
 */
export const redactUrl = (url: string): string => {
  const urlObj = new URL(url, true)
  const { query } = urlObj
  const secrets = SECRET_QUERY_PARAMS.filter(name => query[name] != null)
  if (secrets.length === 0) return redactRawQuery(url)
  for (const name of secrets) query[name] = 'redacted'
  urlObj.set('query', query)
  return redactRawQuery(urlObj.href)
}
