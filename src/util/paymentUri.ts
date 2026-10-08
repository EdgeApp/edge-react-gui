import type { EdgeCurrencyConfig } from 'edge-core-js'
import URL from 'url-parse'

/**
 * What a scanned payment code says about its own chain, read without loading
 * any chain's parser. Detection uses this to pick the destination chain; the
 * chosen chain's `parseUri` then reads the code for real.
 */
export interface PaymentUriPeek {
  /**
   * Bare-address readings for the per-chain address prefilter, in priority
   * order: the raw text itself (bare addresses, and cashaddr-style addresses
   * whose on-chain form keeps the `prefix:`), the scheme-prefixed path, and
   * the naked path with EIP-681's `pay-` prefix and `@chainId` suffix removed.
   *
   * Empty for an EIP-681 function call
   * (`ethereum:<token>@1/transfer?address=<payee>`), whose path is the TOKEN
   * CONTRACT rather than the payee: matching a chain on it would offer to pay
   * a contract.
   */
  addressCandidates: string[]

  /**
   * The URI scheme (`ethereum` in `ethereum:0x...`), absent for plain text.
   * Names the destination chain outright, which is how a cross-chain paste can
   * be resolved without guessing between chains that share an address format.
   */
  scheme?: string

  /**
   * The EIP-681 `@chainId` suffix (`137` in `ethereum:0x...@137`), decimal or
   * `0x` hex as written.
   *
   * Every EVM network's payment code uses the `ethereum:` scheme and states
   * which network it means here, so the scheme alone identifies the FAMILY and
   * this identifies the CHAIN. Reading the scheme without it sends a Polygon,
   * Arbitrum or Base code to Ethereum mainnet.
   */
  evmChainId?: number
}

/**
 * Reads the scheme and EIP-681 chain id off scanned or pasted text. Plain text
 * that is not a URI passes through as its own single candidate.
 */
export function peekPaymentUri(text: string): PaymentUriPeek {
  const trimmed = text.trim()
  const url = new URL(trimmed, {}, false)
  if (url.protocol === '') return { addressCandidates: [trimmed] }

  const scheme = url.protocol.slice(0, -1)
  // url-parse lowercases the host of a `scheme://` form, which corrupts a
  // case-sensitive address, so that form reads its path from the text itself:
  const path = url.slashes
    ? trimmed.slice(url.protocol.length + 2).split('?')[0]
    : url.pathname
  const [target, ...functionCall] = path.replace(/^pay-/, '').split('/')
  const [bareAddress, chainIdText] = target.split('@')
  const evmChainId = parseChainId(chainIdText)
  if (functionCall.length > 0) {
    return { addressCandidates: [], scheme, evmChainId }
  }

  const addressCandidates: string[] = []
  for (const candidate of [trimmed, `${scheme}:${path}`, bareAddress]) {
    if (candidate === '' || addressCandidates.includes(candidate)) continue
    addressCandidates.push(candidate)
  }
  return { addressCandidates, scheme, evmChainId }
}

function parseChainId(text: string | undefined): number | undefined {
  if (text == null) return undefined
  if (/^\d+$/.test(text)) return parseInt(text, 10)
  if (/^0x[0-9a-f]+$/i.test(text)) return parseInt(text, 16)
  return undefined
}

/** A payment destination on a chain the user holds no wallet for. */
export interface CrossChainPayment {
  publicAddress: string
  /** The amount the code asks for, in the destination chain's native units. */
  nativeAmount?: string
  /**
   * The destination memo the code carries (an XRP `dt`, a `memo` parameter).
   * Memo-required payout chains credit the recipient by this value, so a
   * scanned exchange deposit code that carries one has to keep it.
   */
  memo?: string
}

/**
 * Reads scanned or pasted text with the destination chain's own URI parser,
 * which covers that chain's URI dialect, address forms and checksums without
 * needing a wallet on it.
 *
 * Resolves undefined for anything the parser rejects, and for a code that
 * names one of the chain's tokens: this flow pays out the chain's own coin,
 * so honoring a token code would pay the wrong asset.
 */
export async function parseCrossChainPayment(
  currencyConfig: EdgeCurrencyConfig,
  text: string
): Promise<CrossChainPayment | undefined> {
  const { currencyCode } = currencyConfig.currencyInfo
  try {
    const parsed = await currencyConfig.parseUri(text.trim(), currencyCode)
    const { publicAddress, nativeAmount, tokenId, uniqueIdentifier } = parsed
    if (publicAddress == null || publicAddress === '') return
    if (tokenId != null) return
    return { publicAddress, nativeAmount, memo: uniqueIdentifier }
  } catch (error: unknown) {
    return undefined
  }
}

/**
 * Whether any of these chains' own parsers accepts the text as a payment to
 * its coin. A format shared across chains (any EVM `0x…`) fits all of them by
 * pattern, so only a parser, which checks the checksum, can say the text is
 * an address on one of them.
 */
export async function isPayableOnAny(
  currencyConfigs: EdgeCurrencyConfig[],
  text: string
): Promise<boolean> {
  const payments = await Promise.all(
    currencyConfigs.map(
      async currencyConfig => await parseCrossChainPayment(currencyConfig, text)
    )
  )
  return payments.some(payment => payment != null)
}
