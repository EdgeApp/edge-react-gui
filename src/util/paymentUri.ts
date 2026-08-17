export interface ParsedPaymentUri {
  /**
   * Possible bare-address readings of the scanned text, in priority order:
   * the raw text itself (bare addresses, and cashaddr-style addresses whose
   * on-chain form keeps the `prefix:`), the scheme-prefixed path with the
   * query stripped, and the naked path with scheme, EIP-681 `pay-` prefix,
   * and `@chainId` suffix removed.
   */
  addressCandidates: string[]

  /**
   * Payment amount in display (exchange-denomination) units of the URI's
   * chain, from a BIP-21 `amount=` or Monero-family `tx_amount=` parameter.
   */
  displayAmount?: string

  /**
   * The URI scheme (`ethereum` in `ethereum:0x...`), absent for plain text.
   * Names the destination chain outright, which is how a cross-chain paste can
   * be resolved without guessing between chains that share an address format.
   */
  scheme?: string

  /**
   * The EIP-681 `@chainId` suffix (`137` in `ethereum:0x...@137`), as written.
   *
   * Every EVM network's payment code uses the `ethereum:` scheme and states
   * which network it means here, so the scheme alone identifies the FAMILY and
   * this identifies the CHAIN. Reading the scheme without it sends a Polygon,
   * Arbitrum or Base code to Ethereum mainnet.
   */
  evmChainId?: string

  /**
   * A destination memo carried by the URI: a `dt` destination tag (XRP), or a
   * `memo`, `tag` or `message` parameter. Memo-required payout chains credit
   * the recipient by this value, so a scanned exchange deposit code that
   * carries one has to keep it.
   */
  memo?: string
}

const schemeRegex = /^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/s
const displayAmountRegex = /^\d+(\.\d+)?$/

/**
 * Splits a scanned payment URI (BIP-21 / EIP-681 style) into bare-address
 * candidates and a display-units amount, without any chain-specific parser.
 * Used for send-to-address swap destinations, where the destination chain has
 * no wallet whose `parseUri` could do this properly. Plain text that is not a
 * URI passes through as its own single candidate.
 */
export function parsePaymentUri(text: string): ParsedPaymentUri {
  const trimmed = text.trim()
  const schemeMatch = schemeRegex.exec(trimmed)
  if (schemeMatch == null) return { addressCandidates: [trimmed] }

  const [, scheme, rest] = schemeMatch
  const queryIndex = rest.indexOf('?')
  const path = queryIndex < 0 ? rest : rest.slice(0, queryIndex)
  const query = queryIndex < 0 ? '' : rest.slice(queryIndex + 1)

  // Parse the query parameters:
  const params = new Map<string, string>()
  for (const pair of query.split('&')) {
    if (pair === '') continue
    const eqIndex = pair.indexOf('=')
    if (eqIndex < 0) continue
    try {
      params.set(
        decodeURIComponent(pair.slice(0, eqIndex)).toLowerCase(),
        decodeURIComponent(pair.slice(eqIndex + 1))
      )
    } catch (error: unknown) {
      // Malformed percent-encoding; skip the parameter.
    }
  }

  const memo =
    params.get('dt') ??
    params.get('memo') ??
    params.get('tag') ??
    params.get('message')
  const amountParam = params.get('amount') ?? params.get('tx_amount')
  const displayAmount =
    amountParam != null && displayAmountRegex.test(amountParam.trim())
      ? amountParam.trim()
      : undefined

  // The naked address: no scheme or `//`, and without EIP-681's optional
  // `pay-` prefix and `@chainId` suffix:
  let bareAddress = path.replace(/^\/\//, '')
  if (bareAddress.startsWith('pay-')) bareAddress = bareAddress.slice(4)
  const atIndex = bareAddress.indexOf('@')
  let evmChainId: string | undefined
  let isFunctionCall = bareAddress.includes('/')
  if (atIndex >= 0) {
    const suffix = bareAddress.slice(atIndex + 1)
    // EIP-681 allows a function-call suffix after the chain id; only the
    // leading digits name the chain.
    const chainIdMatch = /^\d+/.exec(suffix)
    if (chainIdMatch != null) evmChainId = chainIdMatch[0]
    if (suffix.includes('/')) isFunctionCall = true
    bareAddress = bareAddress.slice(0, atIndex)
  }

  // An EIP-681 function call (`ethereum:<token>@1/transfer?address=<payee>`)
  // puts the TOKEN CONTRACT in the path and the payee in a parameter, so the
  // path address is the one thing that must not be offered as a destination:
  // adopting it would send the chain's native coin to a contract. No candidate
  // is offered rather than reading the payee out, because a token destination
  // is not something this flow can pay anyway, and an invalid-address refusal
  // is the honest answer to a code the app cannot honor.
  const addressCandidates: string[] = []
  if (!isFunctionCall) {
    for (const candidate of [trimmed, `${scheme}:${path}`, bareAddress]) {
      if (candidate === '' || addressCandidates.includes(candidate)) continue
      addressCandidates.push(candidate)
    }
  }

  return { addressCandidates, displayAmount, scheme, evmChainId, memo }
}
