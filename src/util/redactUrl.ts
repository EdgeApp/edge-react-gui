import URL from 'url-parse'

/**
 * Query parameters whose value proves an order belongs to the account, such
 * as the `externalTransactionId` a MoonPay sell widget opens with. Release
 * builds write `console.log` to the log file users export or send to Edge,
 * so these never go there in the clear.
 */
const SECRET_QUERY_PARAMS = ['externalTransactionId']

/** Return `url` with each secret query parameter's value hidden, for logs. */
export const redactUrl = (url: string): string => {
  const urlObj = new URL(url, true)
  const { query } = urlObj
  const secrets = SECRET_QUERY_PARAMS.filter(name => query[name] != null)
  if (secrets.length === 0) return url
  for (const name of secrets) query[name] = 'redacted'
  urlObj.set('query', query)
  return urlObj.href
}
