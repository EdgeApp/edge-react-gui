import type {
  EdgeCurrencyConfig,
  EdgeCurrencyWallet,
  EdgeMetadata,
  EdgeParsedUri,
  EdgeTokenId
} from 'edge-core-js'
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
  /** The payout asset's code, which names it in the address warnings. */
  currencyCode: string
  /**
   * The amount the code asks for, in the payout asset's native units. Left
   * out when the code states it in another asset.
   */
  nativeAmount?: string
  /**
   * The destination memo the code carries (an XRP `dt`, a `memo` parameter).
   * Memo-required payout chains credit the recipient by this value, so a
   * scanned exchange deposit code that carries one has to keep it.
   */
  memo?: string
  /**
   * The parser's metadata. A gateway code (`<pluginId>://...`) sets
   * `metadata.gateway`, which `addressWarnings` asks the user to confirm.
   */
  metadata?: EdgeMetadata
  /** Set when the address is a legacy format `addressWarnings` warns about. */
  legacyAddress?: string
}

/**
 * Reads scanned or pasted text with the destination chain's own URI parser,
 * which covers that chain's URI dialect, address forms and checksums without
 * needing a wallet on it.
 *
 * Resolves undefined for anything the parser rejects, and for a code that
 * names a token other than the payout: honoring it would pay the wrong
 * asset. A code naming the payout token, such as a USDT invoice for a USDT
 * payout, keeps its amount, which is in that token's units. A coin code on a
 * token payout keeps its address but not its amount, which is in the coin.
 */
export async function parseCrossChainPayment(
  currencyConfig: EdgeCurrencyConfig,
  text: string,
  payoutTokenId: EdgeTokenId = null
): Promise<CrossChainPayment | undefined> {
  try {
    const parsed = await parseAsPayout(
      currencyConfig,
      text.trim(),
      payoutTokenId
    )
    const {
      publicAddress,
      nativeAmount,
      uniqueIdentifier,
      metadata,
      legacyAddress
    } = parsed
    if (publicAddress == null || publicAddress === '') return
    const statedTokenId = parsed.tokenId ?? null
    if (statedTokenId != null && statedTokenId !== payoutTokenId) return
    const payoutToken =
      payoutTokenId == null
        ? undefined
        : currencyConfig.allTokens[payoutTokenId]
    return {
      publicAddress,
      currencyCode:
        payoutToken?.currencyCode ?? currencyConfig.currencyInfo.currencyCode,
      nativeAmount: statedTokenId === payoutTokenId ? nativeAmount : undefined,
      memo: uniqueIdentifier,
      metadata,
      legacyAddress
    }
  } catch (error: unknown) {
    return undefined
  }
}

/**
 * Asks the chain's parser for its coin first, so a code that names no asset
 * reads as the coin. A parser that refuses a token's code when asked for the
 * coin (EVM chains throw on a `transfer` code for any other asset) gets the
 * payout token's own code next, but only for a payment URI: bare text asked
 * as a token can turn into a different payment altogether, such as Tron's
 * PIX lookup for USDT.
 */
async function parseAsPayout(
  currencyConfig: EdgeCurrencyConfig,
  text: string,
  payoutTokenId: EdgeTokenId
): Promise<EdgeParsedUri> {
  const { currencyCode } = currencyConfig.currencyInfo
  try {
    return await currencyConfig.parseUri(text, currencyCode)
  } catch (error: unknown) {
    const payoutToken =
      payoutTokenId == null
        ? undefined
        : currencyConfig.allTokens[payoutTokenId]
    if (payoutToken == null || peekPaymentUri(text).scheme == null) throw error
    return await currencyConfig.parseUri(text, payoutToken.currencyCode)
  }
}

/** A payment the sending wallet's own parser read, address included. */
export type OwnNetworkPayment = EdgeParsedUri & { publicAddress: string }

/**
 * Names the asset a payment code states its amount in, on a parse the sending
 * wallet made.
 *
 * The wallet stamps the asset it was asked about on any parse that names
 * none. An EIP-681 coin payment (`ethereum:<payee>?value=<wei>`) names none,
 * and its `value` is the chain's coin whatever is being sent, so a token
 * send's parse of it comes back as that many of the token: 500 of a
 * six-decimal token for half a gwei. The text settles it. A `value` with no
 * function call is the coin, and the parse says so with a `tokenId` of `null`.
 */
export function withStatedAsset<T extends EdgeParsedUri>(
  parsedUri: T,
  text: string
): T {
  if (parsedUri.nativeAmount == null || !statesCoinValue(text)) return parsedUri
  return { ...parsedUri, tokenId: null }
}

function statesCoinValue(text: string): boolean {
  const trimmed = text.trim()
  const { scheme, addressCandidates } = peekPaymentUri(trimmed)
  // A function call (no address candidates) spends its `value` on a contract:
  if (scheme == null || addressCandidates.length === 0) return false
  return new URL(trimmed, {}, true).query.value != null
}

/**
 * Reads scanned or pasted text with the sending wallet's own parser, for a
 * send whose recipient is set to another network. The full parse comes back,
 * so a payment code keeps its amount, memo and metadata.
 *
 * Resolves undefined for anything the parser rejects, and for a code that
 * names a different asset than the one being sent: the wallet reports the
 * asset a code names, and paying one asset to a request for another is wrong.
 * That covers a coin-denominated code on a token send, which the caller can
 * still pay as a swap to the chain's coin.
 */
export async function parseOwnNetworkPayment(
  wallet: Pick<EdgeCurrencyWallet, 'parseUri'>,
  currencyCode: string,
  tokenId: EdgeTokenId,
  text: string
): Promise<OwnNetworkPayment | undefined> {
  try {
    const trimmed = text.trim()
    const parsed = withStatedAsset(
      await wallet.parseUri(trimmed, currencyCode),
      trimmed
    )
    const { publicAddress } = parsed
    if (publicAddress == null || publicAddress === '') return
    if (parsed.tokenId !== undefined && parsed.tokenId !== tokenId) return
    return { ...parsed, publicAddress }
  } catch (error: unknown) {
    return undefined
  }
}

/**
 * Which side of a cross-asset send a payment code's amount prices, by the
 * asset the code states it in. `undefined` when it states neither side's
 * asset, or carries no amount.
 *
 * A code read by another chain's parser states that chain's coin, and arrives
 * as `crossChainNativeAmount`: the payout, so the receive side. A code read
 * by the sending wallet states the asset its parse names once
 * `withStatedAsset` has corrected it, a `tokenId` of `null` or none being the
 * chain's coin. An amount in the asset being sent is what the wallet sends,
 * and one in the payout asset, on the same chain, is what the recipient gets.
 * Any other asset prices neither: 5 SOL in lamports is 5,000 USDC.
 */
export function getUriAmountSide(opts: {
  parsedUri: EdgeParsedUri
  crossChainNativeAmount: string | undefined
  sourceTokenId: EdgeTokenId
  /** The payout's `tokenId` when it is on the sending chain, or `undefined`. */
  sameChainDestTokenId: EdgeTokenId | undefined
}): { side: 'send' | 'receive'; nativeAmount: string } | undefined {
  const { crossChainNativeAmount, parsedUri, sameChainDestTokenId } = opts
  if (crossChainNativeAmount != null) {
    return { side: 'receive', nativeAmount: crossChainNativeAmount }
  }
  const { nativeAmount } = parsedUri
  if (nativeAmount == null) return
  const statedTokenId = parsedUri.tokenId ?? null
  if (statedTokenId === sameChainDestTokenId) {
    return { side: 'receive', nativeAmount }
  }
  if (statedTokenId === opts.sourceTokenId) {
    return { side: 'send', nativeAmount }
  }
}

/** A chain whose own parser accepted the text, with what it read. */
export interface PayableChain<T> {
  chain: T
  payment: CrossChainPayment
}

/**
 * The chains whose own parsers accept the text as a payment to their coin, in
 * the order given. A format shared across chains (any EVM `0x…`) fits all of
 * them by pattern, so only a parser, which checks the checksum, can say the
 * text is an address on one of them.
 */
export async function findPayableChains<T>(
  chains: T[],
  currencyConfigOf: (chain: T) => EdgeCurrencyConfig,
  text: string
): Promise<Array<PayableChain<T>>> {
  const payments = await Promise.all(
    chains.map(
      async chain => await parseCrossChainPayment(currencyConfigOf(chain), text)
    )
  )
  const payable: Array<PayableChain<T>> = []
  chains.forEach((chain, index) => {
    const payment = payments[index]
    if (payment != null) payable.push({ chain, payment })
  })
  return payable
}
