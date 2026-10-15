import {
  asBoolean,
  asMaybe,
  asObject,
  asOptional,
  asString,
  type Cleaner
} from 'cleaners'
import type {
  EdgeCurrencyConfig,
  EdgeCurrencyWallet,
  EdgeMemo,
  EdgeParsedUri,
  EdgePluginMap,
  EdgeSwapSendRequest,
  EdgeTokenId
} from 'edge-core-js'

import type { DisableAsset } from '../actions/ExchangeInfoActions'
import type { EdgeAsset } from '../types/types'
import { peekPaymentUri } from './paymentUri'
import { disableAssetsCover } from './stealthSwap'

/** What Houdini can do with one asset it serves. */
export interface HoudiniAssetSupport {
  /**
   * Whether Houdini can route the asset to ITSELF privately. Same-asset
   * private is their dominant flow, and it is an asset capability rather than
   * a per-pair verdict, so it reads off the served list with no quote and no
   * probing.
   */
  hasSelfPrivate: boolean
}

/**
 * A chain HoudiniSwap can pay out on, keyed by the Edge currency pluginId.
 *
 * Everything but `evmChainId` comes from the info server's `houdiniAssets`
 * rollup field, which mirrors Houdini's own asset list keyed by Edge
 * `pluginId` and `tokenId`. `addressValidation` is Houdini's per-chain regex,
 * used only to prefilter which chain a pasted address could belong to; the
 * chosen chain's own `parseUri` is what validates it. `memoNeeded` chains show
 * a destination-tag row whose value rides the send request's `toMemos` to the
 * plugin and onward as `destinationTag` on order creation.
 */
export interface HoudiniChain {
  pluginId: string
  memoNeeded: boolean
  addressValidation: RegExp

  /**
   * The chain's EVM network id, for the chains that have one. A payment code
   * for any EVM network is written `ethereum:<address>@<chainId>`, so the
   * scheme names only the family and this is what names the chain. Absent for
   * everything that is not an EVM network, which is why a chain id matching
   * nothing here resolves to nothing rather than to Ethereum.
   */
  evmChainId?: number

  /** The chain's own coin, absent when Houdini serves only its tokens. */
  coin?: HoudiniAssetSupport
  /** The tokens Houdini serves on the chain, by Edge `tokenId`. */
  tokens: Map<string, HoudiniAssetSupport>
}

/**
 * Every chain Houdini serves, by Edge pluginId, in pluginId order. Empty until
 * the first info server rollup carrying a Houdini list loads, which leaves no
 * Houdini destination and both Stealth toggles hidden. Once loaded, a later
 * rollup without the list keeps it (see `updateHoudiniChains`).
 */
export type HoudiniChains = Map<string, HoudiniChain>

/**
 * Edge's own data about the chains Houdini serves, which Houdini's list does
 * not carry.
 *
 * `evmChainId` values come from each chain's own currency plugin
 * (`chainParams.chainId`), which the GUI cannot read at runtime:
 * `EdgeCurrencyInfo.defaultSettings` is deprecated and always empty.
 *
 * `addressValidation` replaces a served pattern that is known to be wrong:
 *
 * - cardano: Houdini's ends in `|^[a-zA-z0-9]*|[0-9A-Za-z]{45,65}$`, whose
 *   first alternative is unanchored and zero-length and so matches EVERY
 *   string. The two catch-alls are dropped: they would accept any typo as a
 *   Cardano address and make any pasted address look like a Cardano one.
 * - dash, monero: a `|` inside a character class is a literal pipe, not an
 *   alternative, so the served patterns accept a pipe in an address.
 * - ecash: the prefix-less cashaddr form is spelled `[0-9A-Za-z]{42}`, which
 *   claims every `0x` EVM address. Narrowed to the bech32 charset cashaddr
 *   uses, with its `q`/`p` type prefix.
 * - hedera: unescaped dots are wildcards, and the four-digit floor rejects
 *   early account ids, which are genuinely short (0.0.98).
 * - pivx: the served class admits `0`, `O`, `I` and `l`, which base58 leaves
 *   out. Edge's pattern is base58 and, as before, omits the `EXM` form.
 * - solana: the served floor of 32 reaches into the 33-34 character band of
 *   the Bitcoin-family legacy forms. A Solana address is a base58 32-byte key,
 *   43-44 characters and 42 for about one key in a thousand. The 42-character
 *   band is also the length of a Bitcoin P2WPKH `bc1` address and a cashaddr
 *   without its prefix, both single-case bech32, and about one in twelve of
 *   those uses only base58 characters. Edge's pattern therefore also requires
 *   both letter cases, which a random 42-character base58 key lacks about once
 *   in four billion.
 *
 * `memoNeeded: true` keeps the destination-tag row on the chains whose
 * deposits are credited only by tag, whatever the served flag says. A served
 * `false` there would drop the tag and pay a deposit that cannot be
 * attributed, so the served flag can add a memo chain but never remove one.
 */
const EDGE_CHAIN_DATA: Record<
  string,
  { evmChainId?: number; addressValidation?: RegExp; memoNeeded?: true }
> = {
  arbitrum: { evmChainId: 42161 },
  avalanche: { evmChainId: 43114 },
  base: { evmChainId: 8453 },
  binancesmartchain: { evmChainId: 56 },
  cardano: {
    addressValidation:
      /^([1-9A-HJ-NP-Za-km-z]{59}|[0-9A-Za-z]{100,104}|[0-9a-fA-F]{64}|addr[0-9A-Za-z]{45,65})$/
  },
  celo: { evmChainId: 42220 },
  cosmoshub: { memoNeeded: true },
  dash: { addressValidation: /^[X7][0-9A-Za-z]{33}$/ },
  ecash: {
    addressValidation:
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^[qp][qpzry9x8gf2tvdw0s3jn54khce6mua7l]{41}$|^ecash:[qp][qpzry9x8gf2tvdw0s3jn54khce6mua7l]{29,69}$/
  },
  ethereum: { evmChainId: 1 },
  fantom: { evmChainId: 250 },
  hedera: { addressValidation: /^0\.0\.[0-9]{1,20}$/, memoNeeded: true },
  hyperevm: { evmChainId: 999 },
  monad: { evmChainId: 143 },
  monero: { addressValidation: /^[48][a-zA-Z\d]{94}([a-zA-Z\d]{11})?$/ },
  opbnb: { evmChainId: 204 },
  optimism: { evmChainId: 10 },
  pivx: { addressValidation: /^D[1-9A-HJ-NP-Za-km-z]{33}$/ },
  polygon: { evmChainId: 137 },
  pulsechain: { evmChainId: 369 },
  ripple: { memoNeeded: true },
  robinhood: { evmChainId: 4663 },
  rsk: { evmChainId: 30 },
  solana: {
    addressValidation:
      /^(?=.*[A-HJ-NP-Z])(?=.*[a-km-z])[1-9A-HJ-NP-Za-km-z]{42,44}$/
  },
  sonic: { evmChainId: 146 },
  stellar: { memoNeeded: true },
  thorchainrune: { memoNeeded: true },
  ton: { memoNeeded: true },
  zksync: { evmChainId: 324 }
}

/**
 * Text no address format should accept. A served pattern that matches one is
 * a catch-all (Houdini serves `^.*$` for some chains), which would claim every
 * pasted address for its chain.
 */
const NON_ADDRESSES = ['', ' ', 'not an address']

/**
 * The regex a chain's addresses are prefiltered with: Edge's replacement when
 * one exists, otherwise the served pattern. `undefined` when the served
 * pattern does not compile or accepts text that is no address, which leaves
 * the chain out rather than letting it claim every paste.
 */
function getAddressValidation(
  pluginId: string,
  pattern: string
): RegExp | undefined {
  const replacement = EDGE_CHAIN_DATA[pluginId]?.addressValidation
  if (replacement != null) return replacement
  let regex: RegExp
  try {
    regex = new RegExp(pattern)
  } catch (error: unknown) {
    return undefined
  }
  return NON_ADDRESSES.some(text => regex.test(text)) ? undefined : regex
}

const asServedAsset = asObject({ hasSelfPrivate: asBoolean })
const asServedChain = asObject({
  memoNeeded: asBoolean,
  addressValidation: asString,
  coin: asOptional(asServedAsset),
  tokens: asObject(asServedAsset)
})

/**
 * Cleans the info server's `houdiniAssets` field into `HoudiniChains`. A
 * chain entry of the wrong shape, or with an unusable address pattern, is
 * left out on its own, so one bad entry does not cost the other chains.
 */
export const asHoudiniChains: Cleaner<HoudiniChains> = raw => {
  const served = asObject(asMaybe(asServedChain))(raw)
  const chains: HoudiniChains = new Map()
  for (const pluginId of Object.keys(served).sort()) {
    const chain = served[pluginId]
    if (chain == null) continue
    const addressValidation = getAddressValidation(
      pluginId,
      chain.addressValidation
    )
    if (addressValidation == null) continue
    chains.set(pluginId, {
      pluginId,
      memoNeeded:
        chain.memoNeeded || EDGE_CHAIN_DATA[pluginId]?.memoNeeded === true,
      addressValidation,
      evmChainId: EDGE_CHAIN_DATA[pluginId]?.evmChainId,
      coin: chain.coin,
      tokens: new Map(Object.entries(chain.tokens))
    })
  }
  return chains
}

/**
 * Houdini's own minimum order sizes, in USD. Their guidance, verbatim: "on your
 * side you should stick to our hardcoded minimums that under 25 USD there are
 * no routes for private."
 *
 * Confirmed against the live v2 API on 2026-07-30 rather than taken on faith.
 * Cross-asset TRX to LTC answered 422 "Amount is too low, minimum is 10 USD" at
 * 8 USD, returned standard routes only from 12 to 24 USD, and added private
 * routes from 25 USD up. Same-asset TRX to TRX answered 422 "Amount is too low,
 * minimum is 25 USD" below 25 and returned private routes only above it.
 *
 * These are floors, not the whole story: individual tokens carry higher
 * server-side minimums that cannot be known upfront (Polygon private is
 * effectively 60 USD), which arrive as quote errors carrying the real minimum.
 */
export const HOUDINI_MIN_USD = {
  /** Private (multi-exchange) routes, which every stealth flow requires. */
  private: '25',
  /** Standard (single-exchange) routes, used by a plain swap-and-send. */
  standard: '10',
  /** On-chain DEX routes, offered only for assets with `hasDex`. */
  dex: '5'
} as const

/**
 * Look up the Houdini chain an Edge plugin maps to, if served. The chain holds
 * what is true of every asset on it: its address format, memo flag and EVM
 * chain id. Whether Houdini serves one particular asset there is answered by
 * `getHoudiniAssetSupport`.
 */
export function getHoudiniChain(
  houdiniChains: HoudiniChains,
  pluginId: string
): HoudiniChain | undefined {
  return houdiniChains.get(pluginId)
}

/** The part of the account's currency configs the asset listing reads. */
export type HoudiniCurrencyConfigs = EdgePluginMap<
  Pick<EdgeCurrencyConfig, 'allTokens'>
>

/**
 * Look up an Edge asset in what Houdini serves, or get `undefined` when it
 * does not serve the asset. The served list is keyed by Edge `tokenId`, so a
 * custom token the user added matches the same way a built-in one does.
 */
export function getHoudiniAssetSupport(opts: {
  asset: EdgeAsset
  houdiniChains: HoudiniChains
}): HoudiniAssetSupport | undefined {
  const { asset, houdiniChains } = opts
  const chain = houdiniChains.get(asset.pluginId)
  if (chain == null) return undefined
  return asset.tokenId == null ? chain.coin : chain.tokens.get(asset.tokenId)
}

/**
 * Every asset Houdini serves that this account has a currency plugin and a
 * token definition for, in picker order: each chain's coin, when served,
 * followed by that chain's tokens sorted by name. `destinationBans` removes
 * the assets the info server withdrew as swap destinations.
 */
export function getHoudiniAssets(opts: {
  currencyConfigs: HoudiniCurrencyConfigs
  houdiniChains: HoudiniChains
  destinationBans?: DisableAsset[]
}): EdgeAsset[] {
  const { currencyConfigs, destinationBans = [], houdiniChains } = opts

  const assets: EdgeAsset[] = []
  for (const chain of houdiniChains.values()) {
    const { pluginId } = chain
    const currencyConfig = currencyConfigs[pluginId]
    if (currencyConfig == null) continue
    if (chain.coin != null) assets.push({ pluginId, tokenId: null })

    const { allTokens } = currencyConfig
    const tokenIds = [...chain.tokens.keys()].filter(tokenId =>
      Object.prototype.hasOwnProperty.call(allTokens, tokenId)
    )
    tokenIds.sort((a, b) => {
      const byName = allTokens[a].displayName.localeCompare(
        allTokens[b].displayName
      )
      return byName !== 0 ? byName : a.localeCompare(b)
    })
    for (const tokenId of tokenIds) assets.push({ pluginId, tokenId })
  }

  return assets.filter(
    asset => !disableAssetsCover(destinationBans, asset.pluginId, asset.tokenId)
  )
}

/**
 * Whether a pasted address fits the chain's address format. A prefilter for
 * detection only: the chain's `parseUri` is the validator.
 */
export function isValidHoudiniAddress(
  chain: HoudiniChain,
  address: string
): boolean {
  return chain.addressValidation.test(address.trim())
}

/**
 * Find the destination chains a pasted string could be paying, for input the
 * source wallet itself could not parse. An address belonging to another chain
 * is not a typo: it is a cross-chain send whose recipient asset the user has
 * not picked yet, so the caller can offer the swap instead of an error.
 *
 * An explicit URI scheme (`ethereum:0x...`) names the chain outright and wins.
 * A bare address is matched against each served chain's own regex, which is
 * ambiguous by construction for the EVM family, so every match is returned for
 * the caller to disambiguate rather than guessing and misdirecting funds.
 */
export function detectHoudiniChains(
  text: string,
  opts: {
    /** Every chain Houdini serves. */
    houdiniChains: HoudiniChains
    /** The sending wallet's chain. */
    sourcePluginId: string
    /**
     * The sending wallet's token, or `null` for the chain's own coin.
     *
     * The source chain is only excluded from the candidates when the source IS
     * that chain's coin, because there the destination would be the same asset
     * the user is already sending and the plain send path covers it. From a
     * TOKEN the source chain is a real destination: USDC on Ethereum paying out
     * native ETH is a cross-asset route no plain send can make, and dropping it
     * left a pasted `0x` address offering every OTHER EVM network but not the
     * one the recipient actually holds.
     */
    sourceTokenId: string | null
    /** Whether the account has a currency plugin for this chain. */
    isSupported: (pluginId: string) => boolean
  }
): HoudiniChain[] {
  const { houdiniChains, sourcePluginId, sourceTokenId, isSupported } = opts
  const { addressCandidates, scheme, evmChainId } = peekPaymentUri(text)

  // A pasted address resolves to the chain's coin, so a chain Houdini serves
  // only tokens on (Celo, Fantom) has no destination to offer for it:
  const served = [...houdiniChains.values()].filter(
    chain =>
      chain.coin != null &&
      (chain.pluginId !== sourcePluginId || sourceTokenId != null) &&
      isSupported(chain.pluginId)
  )
  const matchesAddress = (chain: HoudiniChain): boolean =>
    addressCandidates.some(candidate => isValidHoudiniAddress(chain, candidate))

  // An EIP-681 chain id names the network outright, and it has to be read
  // BEFORE the scheme: every EVM network writes `ethereum:`, so the scheme
  // alone would resolve a Polygon or Base code to Ethereum mainnet. A chain id
  // that matches nothing served resolves to nothing rather than falling back to
  // the scheme, since guessing here picks the wrong chain to pay.
  if (evmChainId != null) {
    const named = served.find(chain => chain.evmChainId === evmChainId)
    return named != null && matchesAddress(named) ? [named] : []
  }

  if (scheme != null) {
    const named = served.find(chain => schemeNamesChain(scheme, chain))
    if (named != null && matchesAddress(named)) return [named]
  }

  return served.filter(matchesAddress)
}

/**
 * Whether a payment URI's scheme names this chain, by its Edge plugin id
 * (`ethereum:`, `bitcoincash:`).
 *
 * A scheme is the one part of a scanned code that states its chain outright, so
 * it has to be checked even when a destination is already picked: chains that
 * share an address format (the whole EVM family) validate each other's
 * addresses, and accepting an `ethereum:` code against a picked Polygon
 * destination would send to the wrong chain and price the URI's amount in the
 * wrong asset.
 */
export function schemeNamesChain(scheme: string, chain: HoudiniChain): boolean {
  return chain.pluginId === scheme.toLowerCase()
}

/**
 * Whether text a wallet could not parse is still written for that wallet's own
 * chain: a bare address in the chain's format, or a payment URI that names the
 * chain and carries one. Such text is a bad address on this chain (a failed
 * checksum), whatever other chains share the format.
 *
 * A URI is read by what it names, an EIP-681 chain id before the scheme, so
 * `polygon:0x…` and `ethereum:0x…@137` are not Ethereum's own text even though
 * the address inside fits Ethereum's format.
 */
export function isOwnChainAddressText(
  chain: HoudiniChain,
  text: string
): boolean {
  const { addressCandidates, scheme, evmChainId } = peekPaymentUri(text)
  const namesOtherChain =
    evmChainId != null
      ? evmChainId !== chain.evmChainId
      : scheme != null && !schemeNamesChain(scheme, chain)
  return (
    !namesOtherChain &&
    addressCandidates.some(candidate => isValidHoudiniAddress(chain, candidate))
  )
}

/**
 * The asset the recipient actually receives.
 *
 * A swap-send pays out the destination asset the quote asks for, coin or
 * token. A plain send delivers the source asset verbatim. Both the "Recipient
 * receives" row and that row's picker read this, so the row always names the
 * asset the order pays out.
 */
export function getRecipientAsset(opts: {
  source: EdgeAsset
  /** The picked destination asset, or the source asset when none is picked. */
  destination: EdgeAsset
  swapSendActive: boolean
}): EdgeAsset {
  const { destination, source, swapSendActive } = opts
  return swapSendActive ? destination : source
}

/**
 * Why a send cannot go back to paying the wallet's own network: the send is
 * private, and the provider has no private route for it.
 */
export type OwnNetworkBlock =
  | 'selfPrivateUnsupported'
  | 'privateRouteUnavailable'

/**
 * Whether the send can pay the wallet's own network once the recipient goes
 * back to it. A plain send always can. A private one needs the provider to
 * offer the route, which is the same pair of checks the Stealth toggle makes
 * before it arms.
 */
export function getOwnNetworkBlock(opts: {
  /** Stealth is on and the send can be routed as a swap. */
  stealthActive: boolean
  /** The source asset's `hasSelfPrivate`. */
  selfPrivateAvailable: boolean
  /**
   * The probed verdict for a private route from the source asset to itself.
   * `undefined` while no probe has answered.
   */
  privateRouteOffered: boolean | undefined
}): OwnNetworkBlock | undefined {
  const { privateRouteOffered, selfPrivateAvailable, stealthActive } = opts
  if (!stealthActive) return
  // Paying the wallet's own network pays out the source asset itself, a coin
  // or a token alike, which is a same-asset send that only the asset's own
  // capability flag allows:
  if (!selfPrivateAvailable) return 'selfPrivateUnsupported'
  if (privateRouteOffered === false) return 'privateRouteUnavailable'
}

/** One row of the "Recipient receives" picker. */
export interface RecipientAssetChoice {
  /** The asset this row names, which is what the recipient would receive. */
  asset: EdgeAsset
  /**
   * The destination asset the scene adopts when this row is picked.
   * `undefined` clears the adopted destination, leaving the source asset.
   */
  pickedAsset: EdgeAsset | undefined
}

/**
 * The rows of the "Recipient receives" picker, in display order.
 *
 * The first row is the source asset with no destination adopted: a plain send,
 * or a same-asset private send with Stealth on. It is always offered, since a
 * send of the source asset needs no swap destination. The rest are
 * `destinationAssets` in the order given, which callers build with
 * `getHoudiniAssets`: each served chain's coin followed by that chain's
 * tokens. The source asset is not repeated among them, because adopting it
 * quotes the same as the first row.
 *
 * Callers must key the rows on the asset rather than on its display name. The
 * POL ERC-20 on Ethereum and the Polygon chain share both their name and their
 * currency code, so a name-keyed list marks both selected and resolves either
 * tap to the same row.
 */
export function getRecipientAssetChoices(opts: {
  source: EdgeAsset
  /** Every asset offered as a swap destination, in picker order. */
  destinationAssets: EdgeAsset[]
}): RecipientAssetChoice[] {
  const { destinationAssets, source } = opts
  const choices: RecipientAssetChoice[] = [
    { asset: source, pickedAsset: undefined },
    ...destinationAssets.map(asset => ({ asset, pickedAsset: asset }))
  ]
  const seen = new Set<string>()
  return choices.filter(choice => {
    const key = recipientAssetKey(choice.asset)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * A stable per-row identity for the picker, since a display name is not one.
 * Natives key on the pluginId alone so the value reads as the chain, which is
 * also what the row's `testID` becomes.
 */
export function recipientAssetKey(asset: EdgeAsset): string {
  return asset.tokenId == null
    ? asset.pluginId
    : `${asset.pluginId}:${asset.tokenId}`
}

/**
 * Whether picking a "Recipient receives" row keeps the entered recipient. An
 * asset on the destination chain already selected is paid at the same address,
 * so the address and its tag stay; an asset on another chain makes both
 * unusable.
 */
export function pickKeepsRecipient(opts: {
  source: EdgeAsset
  /** The destination asset before the pick. */
  destination: EdgeAsset
  /** The picked row's destination, or `undefined` for the source asset. */
  picked: EdgeAsset | undefined
}): boolean {
  const { destination, picked, source } = opts
  return (picked ?? source).pluginId === destination.pluginId
}

/**
 * Which way a memo moves when the send changes mode. A plain send reads its
 * memo from the memo rows and a swap-send reads its tag from the tag row
 * alone. Only one of the two shows at a time, so a value left on the hidden
 * side is dropped from the send.
 *
 * - `toTag`: entering a swap-send to a memo-required destination with the tag
 *   row empty and a plain memo already held, scanned or typed.
 * - `toPlainMemo`: leaving a swap-send with a tag entered, on a source chain
 *   that takes a memo. The tag is the newer entry, so it replaces the plain
 *   memo.
 * - `none`: the mode did not change, or there is nothing to move.
 */
export function getMemoCarry(opts: {
  swapBefore: boolean
  swapAfter: boolean
  tag: string | undefined
  plainMemo: string | undefined
  /** Whether the swap destination requires a memo (`memoNeeded`). */
  tagNeeded: boolean
  /** Whether the source chain has a memo option to hold the tag. */
  plainMemoSupported: boolean
}): 'toTag' | 'toPlainMemo' | 'none' {
  const { plainMemo, plainMemoSupported, swapAfter, swapBefore, tag } = opts
  const hasTag = tag != null && tag !== ''
  const hasPlainMemo = plainMemo != null && plainMemo !== ''
  if (!swapBefore && swapAfter) {
    return opts.tagNeeded && !hasTag && hasPlainMemo ? 'toTag' : 'none'
  }
  if (swapBefore && !swapAfter) {
    return plainMemoSupported && hasTag ? 'toPlainMemo' : 'none'
  }
  return 'none'
}

/**
 * What a source-wallet switch clears.
 *
 * - `none`: the same wallet and asset were picked again.
 * - `destination`: a different wallet holding the same asset, with the
 *   recipient entered for that asset. The picked destination asset and the
 *   quote go, since a held order names the old wallet's refund address, but
 *   the address is still payable.
 * - `destinationAndRecipient`: a different source asset, or a recipient that
 *   was entered for another asset (a swap-send destination or a token payout).
 *   The address goes with the destination asset, or the scene would fall back
 *   to a plain send still showing an address for an asset it no longer sends.
 */
export function getWalletSwitchReset(opts: {
  walletChanged: boolean
  assetChanged: boolean
  /** Whether the destination asset was the source asset before the switch. */
  sameAsset: boolean
}): 'none' | 'destination' | 'destinationAndRecipient' {
  const { assetChanged, sameAsset, walletChanged } = opts
  if (!walletChanged && !assetChanged) return 'none'
  return assetChanged || !sameAsset ? 'destinationAndRecipient' : 'destination'
}

/**
 * The memo move a source-wallet switch makes. Every switch that resets
 * anything disarms Stealth and drops the picked destination, so it leaves any
 * swap-send for a plain send. A `destination` reset keeps the address, so a
 * typed tag moves to the plain memo, as `getMemoCarry` moves it when Stealth
 * is turned off. A `destinationAndRecipient` reset clears the memos along with
 * the address, so there is nothing to keep.
 */
export function getWalletSwitchMemoCarry(opts: {
  reset: 'none' | 'destination' | 'destinationAndRecipient'
  /** Whether the send was a swap-send before the switch. */
  swapBefore: boolean
  tag: string | undefined
  plainMemo: string | undefined
  /** Whether the source chain has a memo option to hold the tag. */
  plainMemoSupported: boolean
}): 'toPlainMemo' | 'none' {
  const { plainMemo, plainMemoSupported, reset, swapBefore, tag } = opts
  if (reset !== 'destination') return 'none'
  const carry = getMemoCarry({
    swapBefore,
    swapAfter: false,
    tag,
    plainMemo,
    tagNeeded: false,
    plainMemoSupported
  })
  return carry === 'toPlainMemo' ? 'toPlainMemo' : 'none'
}

/**
 * What a "Myself" pick does.
 *
 * - `adopt`: another asset becomes the swap destination, with the picked
 *   wallet's address.
 * - `plainSend`: the source asset with no other destination picked. The
 *   address tile enters the address as a plain send.
 * - `endSwapSend`: the source asset while a cross-asset destination is
 *   picked. The scene clears that destination and enters the address itself,
 *   parsed by the sending wallet, since the tile's handlers still belong to
 *   the render that showed the old destination and would route the address
 *   as a swap on that chain.
 */
export function getSelfTransferPick(opts: {
  source: EdgeAsset
  picked: EdgeAsset
  /** Whether the destination is the source asset before the pick. */
  sameAsset: boolean
}): 'adopt' | 'plainSend' | 'endSwapSend' {
  const { picked, sameAsset, source } = opts
  if (picked.pluginId !== source.pluginId || picked.tokenId !== source.tokenId)
    return 'adopt'
  return sameAsset ? 'plainSend' : 'endSwapSend'
}

/**
 * Whether an entered address prices the receive side, which a cross-asset
 * send does: a payment code's amount is what the recipient should get.
 *
 * A destination detected from the address makes the send cross-asset even
 * though the render-time state has not caught up. `destinationCleared` is the
 * reverse: the caller just cleared the picked destination, so the send is
 * same-asset although the render-time state still shows a cross-asset
 * swap-send.
 */
export function isReceiveSideGuaranteed(opts: {
  detectedDestPluginId: string | undefined
  destinationCleared: boolean
  swapSendActive: boolean
  sameAsset: boolean
}): boolean {
  const {
    destinationCleared,
    detectedDestPluginId,
    sameAsset,
    swapSendActive
  } = opts
  return (
    detectedDestPluginId != null ||
    (!destinationCleared && swapSendActive && !sameAsset)
  )
}

/**
 * A parsed address with the amount the user already entered, for an address
 * re-entered when a destination is cleared. A bare address carries no amount,
 * and the entered one is in the source asset's units on both sides of the
 * switch, so it stays. An amount the address does carry wins.
 */
export function keepEnteredAmount(
  parsedUri: EdgeParsedUri,
  enteredNativeAmount: string | undefined
): EdgeParsedUri {
  return {
    ...parsedUri,
    nativeAmount: parsedUri.nativeAmount ?? enteredNativeAmount
  }
}

/**
 * The swap request for a swap-send: the source asset paid out as the
 * destination asset at the recipient's address. The quote and its error
 * message both build their request here, so the two name the same pair.
 */
export function makeSwapSendRequest(opts: {
  fromWallet: EdgeCurrencyWallet
  fromTokenId: EdgeTokenId
  destination: EdgeAsset
  toAddress: string
  toMemos?: EdgeMemo[]
  nativeAmount: string
  /** The side the entered amount fixes. */
  guaranteedSide: 'send' | 'receive'
  /** Whether the route must be private, as a Stealth send requires. */
  stealth?: boolean
}): EdgeSwapSendRequest {
  const {
    destination,
    fromTokenId,
    fromWallet,
    guaranteedSide,
    nativeAmount,
    stealth = false,
    toAddress,
    toMemos
  } = opts
  return {
    fromWallet,
    fromTokenId,
    toTokenId: destination.tokenId,
    toPluginId: destination.pluginId,
    toAddresses: [{ addressType: 'publicAddress', publicAddress: toAddress }],
    toMemos,
    nativeAmount,
    quoteFor: guaranteedSide === 'send' ? 'from' : 'to',
    privacy: stealth ? 'required' : undefined
  }
}
