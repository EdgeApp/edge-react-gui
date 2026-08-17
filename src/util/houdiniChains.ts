import type { EdgeTokenId } from 'edge-core-js'

import { parsePaymentUri } from './paymentUri'

/**
 * A destination chain HoudiniSwap can pay out to, keyed by the Edge currency
 * pluginId. `addressValidation` is Houdini's own per-chain regex, reused for
 * client-side validation of pasted destination addresses. `memoNeeded` chains
 * show a destination-tag row whose value rides `toAddressInfo.toMemos` to the
 * plugin and onward as `destinationTag` on order creation.
 */
export interface HoudiniChain {
  pluginId: string
  houdiniShortName: string
  memoNeeded: boolean
  /**
   * Whether Houdini can route this asset to ITSELF privately, from the
   * `hasSelfPrivate` flag on their token query. Same-asset private is their
   * dominant flow, and it is an asset capability rather than a per-pair
   * verdict, so it reads off the token metadata with no quote and no probing.
   */
  hasSelfPrivate: boolean

  /**
   * The chain's EVM network id, for the chains that have one. A payment code
   * for any EVM network is written `ethereum:<address>@<chainId>`, so the
   * scheme names only the family and this is what names the chain. Absent for
   * everything that is not an EVM network, which is why a chain id matching
   * nothing here resolves to nothing rather than to Ethereum.
   *
   * Values come from each chain's own currency plugin (`chainParams.chainId`),
   * which the GUI cannot read at runtime: `EdgeCurrencyInfo.defaultSettings` is
   * deprecated and always empty.
   */
  evmChainId?: number
  addressValidation: RegExp
}

/**
 * Snapshot of Houdini's mainnet native tokens (v2 partner API, re-fetched
 * 2026-07-30) intersected with Edge's currency pluginIds, mirroring the
 * edge-exchange-plugins Houdini chain mapping. IBC-family chains are excluded
 * there (no trustworthy memo metadata), so they are absent here too.
 *
 * Every chain listed here resolves to a native token Houdini actually serves.
 * `celo`, `fantom`, `polkadot` and `ton` were listed before and are not: the
 * API returns no mainnet native for them, so every quote to those chains threw
 * while the UI offered them as destinations.
 *
 * This is a snapshot on purpose. Houdini is an aggregator whose per-pair
 * availability fluctuates too fast to track and whose Cloudflare blocks tight
 * probing loops, so nothing here may be discovered at runtime: asset-level
 * capability lives in this table, and pair-level capability is learned only
 * from a real user-initiated quote (`pairCaps`). A follow-up can refresh the
 * table from the API once chain metadata is exposed through the swap plugin.
 */
export const HOUDINI_CHAINS: HoudiniChain[] = [
  {
    pluginId: 'algorand',
    houdiniShortName: 'algorand',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^[A-Z0-9]{58,58}$/
  },
  {
    pluginId: 'arbitrum',
    houdiniShortName: 'arbitrum',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 42161,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'avalanche',
    houdiniShortName: 'avalanche',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 43114,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'base',
    houdiniShortName: 'base',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 8453,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'binancesmartchain',
    houdiniShortName: 'bsc',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 56,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'bitcoin',
    houdiniShortName: 'bitcoin',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation:
      /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39}|bc1[a-z0-9]{59})$/
  },
  {
    pluginId: 'bitcoincash',
    houdiniShortName: 'bitcoincash',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation:
      /^([13][a-km-zA-HJ-NP-Z1-9]{25,34})$|^((bitcoincash:)?(q|p)[a-z0-9]{41})$|^((BITCOINCASH:)?(Q|P)[A-Z0-9]{41})$/
  },
  {
    pluginId: 'bitcoinsv',
    houdiniShortName: 'bsv',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/
  },
  {
    pluginId: 'cardano',
    houdiniShortName: 'cardano',
    memoNeeded: false,
    hasSelfPrivate: true,
    // Houdini's own regex ends in `|^[a-zA-z0-9]*|[0-9A-Za-z]{45,65}$`, whose
    // first alternative is unanchored and zero-length and so matches EVERY
    // string, including empty. Those two catch-alls are dropped here: they
    // would accept any typo as a Cardano address, and they make any pasted
    // address look like it could be paying Cardano.
    addressValidation:
      /^([1-9A-HJ-NP-Za-km-z]{59}|[0-9A-Za-z]{100,104}|[0-9a-fA-F]{64}|addr[0-9A-Za-z]{45,65})$/
  },
  {
    pluginId: 'cosmoshub',
    houdiniShortName: 'cosmoshub-4',
    memoNeeded: true,
    hasSelfPrivate: true,
    addressValidation: /^(cosmos1)[0-9a-z]{38}$/
  },
  {
    pluginId: 'dash',
    houdiniShortName: 'dash',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^[X|7][0-9A-Za-z]{33}$/
  },
  {
    pluginId: 'dogecoin',
    houdiniShortName: 'doge',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^(D|A|9)[a-km-zA-HJ-NP-Z1-9]{33,34}$/
  },
  {
    pluginId: 'ecash',
    houdiniShortName: 'eCash',
    memoNeeded: false,
    hasSelfPrivate: true,
    // The provider's published pattern spells the prefix-less cashaddr forms as
    // `[0-9A-Za-z]`, which matches EVERY 42-character alphanumeric string and so
    // claims every `0x` EVM address as a candidate eCash destination. Narrowed
    // to the bech32 charset cashaddr actually uses (lowercase, no `1bio`) with
    // its `q`/`p` type prefix, which is strictly narrowing and leaves real eCash
    // addresses matching. Same class of defect as the Cardano catch-all above.
    addressValidation:
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^[qp][qpzry9x8gf2tvdw0s3jn54khce6mua7l]{41}$|^ecash:[qp][qpzry9x8gf2tvdw0s3jn54khce6mua7l]{29,69}$/
  },
  {
    pluginId: 'ethereum',
    houdiniShortName: 'ethereum',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 1,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'hedera',
    houdiniShortName: 'hedera',
    memoNeeded: true,
    hasSelfPrivate: true,
    // Dots escaped: unescaped they are wildcards, so the pattern accepted
    // anything shaped like 0X0Y12345 as a Hedera account id. The length bound
    // is 1 and not the provider's 4: account ids are assigned sequentially, so
    // early ones are genuinely short (0.0.98) and a four-digit floor rejects
    // real destinations.
    addressValidation: /^0\.0\.[0-9]{1,20}$/
  },
  {
    pluginId: 'hyperevm',
    houdiniShortName: 'hyperevm',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 999,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'litecoin',
    houdiniShortName: 'litecoin',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^(L|M|3)[A-Za-z0-9]{33}$|^(ltc1)[0-9A-Za-z]{39}$/
  },
  {
    pluginId: 'monero',
    houdiniShortName: 'monero',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^[48][a-zA-Z|\d]{94}([a-zA-Z|\d]{11})?$/
  },
  {
    pluginId: 'opbnb',
    houdiniShortName: 'opbnb',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 204,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'optimism',
    houdiniShortName: 'optimism',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 10,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'pivx',
    houdiniShortName: 'pivx',
    memoNeeded: false,
    hasSelfPrivate: true,
    // Houdini writes `[0-9A-za-z]`, where `A-z` also spans `[ \ ] ^ _ \``.
    // PIVX addresses are base58, so the strict class is used instead.
    addressValidation: /^D[1-9A-HJ-NP-Za-km-z]{33}$/
  },
  {
    pluginId: 'polygon',
    houdiniShortName: 'polygon',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 137,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'pulsechain',
    houdiniShortName: 'pulsechain',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 369,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'ripple',
    houdiniShortName: 'ripple',
    memoNeeded: true,
    hasSelfPrivate: true,
    addressValidation: /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/
  },
  {
    pluginId: 'rsk',
    houdiniShortName: 'rootstock',
    memoNeeded: false,
    hasSelfPrivate: false,
    evmChainId: 30,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'solana',
    houdiniShortName: 'solana',
    memoNeeded: false,
    hasSelfPrivate: true,
    // The provider's published lower bound of 32 reaches down into the length
    // band the Bitcoin-family legacy forms occupy (P2PKH and P2SH are 33-34
    // base58 characters, as are Dogecoin, Litecoin and PIVX), so a legacy UTXO
    // address offered Solana as a destination it is not an account on. A Solana
    // address is a base58 32-byte ed25519 public key, which is 43-44 characters
    // and 42 only for a value small enough to be vanishingly unlikely, so the
    // floor moves to 42: strictly narrowing, and clear of every UTXO form.
    addressValidation: /^[1-9A-HJ-NP-Za-km-z]{42,44}$/
  },
  {
    pluginId: 'sonic',
    houdiniShortName: 'sonic',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 146,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'stellar',
    houdiniShortName: 'xlm',
    memoNeeded: true,
    hasSelfPrivate: true,
    addressValidation: /^G[A-D]{1}[A-Z2-7]{54}$/
  },
  {
    pluginId: 'sui',
    houdiniShortName: 'sui',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^(0x)[0-9A-Za-z]{64}$/
  },
  {
    pluginId: 'telos',
    houdiniShortName: 'telos',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  },
  {
    pluginId: 'thorchainrune',
    houdiniShortName: 'thorchain',
    memoNeeded: true,
    hasSelfPrivate: true,
    addressValidation: /^(thor1)[0-9a-z]{38}$/
  },
  {
    pluginId: 'tron',
    houdiniShortName: 'tron',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^T[1-9A-HJ-NP-Za-km-z]{33}$/
  },
  {
    pluginId: 'zcash',
    houdiniShortName: 'Zcash',
    memoNeeded: false,
    hasSelfPrivate: true,
    addressValidation: /^t1[1-9A-HJ-NP-Za-km-z]{33}$/
  },
  {
    pluginId: 'zksync',
    houdiniShortName: 'zksync-era',
    memoNeeded: false,
    hasSelfPrivate: true,
    evmChainId: 324,
    addressValidation: /^(0x)[0-9A-Za-z]{40}$/
  }
]

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

/** Look up the Houdini destination chain for an Edge asset, if served. */
export function getHoudiniChain(
  pluginId: string,
  tokenId: EdgeTokenId
): HoudiniChain | undefined {
  // Only native (chain) assets are offered as destinations for now:
  if (tokenId != null) return undefined
  return HOUDINI_CHAINS.find(chain => chain.pluginId === pluginId)
}

/** Validate a pasted destination address against the chain's own regex. */
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
  const { sourcePluginId, sourceTokenId, isSupported } = opts
  const { addressCandidates, scheme, evmChainId } = parsePaymentUri(text)

  const served = HOUDINI_CHAINS.filter(
    chain =>
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
    const wanted = Number(evmChainId)
    const named = served.find(chain => chain.evmChainId === wanted)
    return named != null && matchesAddress(named) ? [named] : []
  }

  if (scheme != null) {
    const named = served.find(chain => schemeNamesChain(scheme, chain))
    if (named != null && matchesAddress(named)) return [named]
  }

  return served.filter(matchesAddress)
}

/**
 * Whether a payment URI's scheme names this chain, by either the Edge plugin id
 * or the provider's own chain name (`ethereum:`, `bitcoincash:`).
 *
 * A scheme is the one part of a scanned code that states its chain outright, so
 * it has to be checked even when a destination is already picked: chains that
 * share an address format (the whole EVM family) validate each other's
 * addresses, and accepting an `ethereum:` code against a picked Polygon
 * destination would send to the wrong chain and price the URI's amount in the
 * wrong asset.
 */
export function schemeNamesChain(scheme: string, chain: HoudiniChain): boolean {
  const schemeLower = scheme.toLowerCase()
  return (
    chain.pluginId === schemeLower ||
    chain.houdiniShortName.toLowerCase() === schemeLower
  )
}
