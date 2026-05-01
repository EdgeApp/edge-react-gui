import Resolver from '@unstoppabledomains/resolution'
import { ethers } from 'ethers'

import { getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants'
import { ENV } from '../env'
import { reverseResolveZnsAddress } from './zns'

export type NameService = 'ens' | 'unstoppable' | 'zns'

export interface ReverseLookupResult {
  name: string
  service: NameService
}

// Per-pluginId service dispatch.
//
// Reverse-lookup support is much narrower than forward resolution because each
// service requires either an explicit reverse-record index (ZNS), an EVM-only
// reverse resolver (ENS L1, UD), or both. Services are tried in the listed
// order and the first non-null result wins.
//
// - ZNS: Zcash only. Backed by the ZcashNames indexer; Orchard outputs only.
// - ENS: Ethereum L1 mainnet only. ENSIP-3 reverse records. ENSIP-19 (multi-
//   chain reverse) requires ethers v6 — out of scope until that upgrade.
// - Unstoppable Domains: any EVM chain (per UD docs `Resolution.reverse` only
//   resolves EVM addresses). Requires `UNSTOPPABLE_DOMAINS_API_KEY` in env.
const getReverseLookupServices = (pluginId: string): NameService[] => {
  if (pluginId === 'zcash') return ['zns']
  if (pluginId === 'ethereum') return ['ens', 'unstoppable']
  const info = getSpecialCurrencyInfo(pluginId)
  if (info.walletConnectV2ChainId?.namespace === 'eip155')
    return ['unstoppable']
  return []
}

// Convenience: does any service apply to this pluginId? Used by callers (hook,
// UI) to short-circuit before issuing an async lookup.
export const hasReverseLookupSupport = (pluginId: string): boolean =>
  getReverseLookupServices(pluginId).length > 0

// --- ENS ---
// `getDefaultProvider('mainnet')` returns a FallbackProvider that requires no
// API key but rate-limits modestly. Same default pattern used by the forward
// resolver in AddressTile2. ethers v5's `lookupAddress` performs the full
// ENSIP-3 round-trip (reverse record → forward verify), so the returned name
// is guaranteed to resolve back to `address`. The provider is lazily created
// once and reused across lookups, mirroring `udResolver` — a FallbackProvider
// is otherwise reallocated on every unique-address lookup in tx history.
let ensProvider: ethers.providers.BaseProvider | null = null
const getEnsProvider = (): ethers.providers.BaseProvider => {
  ensProvider ??= ethers.getDefaultProvider('mainnet')
  return ensProvider
}
const reverseLookupEns = async (address: string): Promise<string | null> => {
  return await getEnsProvider().lookupAddress(address)
}

// --- Unstoppable Domains ---
let udResolver: Resolver | null = null
const getUdResolver = (): Resolver | null => {
  if (ENV.UNSTOPPABLE_DOMAINS_API_KEY == null) return null
  udResolver ??= new Resolver({ apiKey: ENV.UNSTOPPABLE_DOMAINS_API_KEY })
  return udResolver
}

// UD's `reverse` throws a `ResolutionError` rather than returning `null` when
// an address simply has no reverse record. Those are permanent "no record"
// conditions, not transient failures, so we map them to `null` (which the
// dispatcher caches) instead of letting them poison `allServicesSucceeded`
// and trigger a network retry on every subsequent lookup. Codes that indicate
// a genuine transient/service failure are re-thrown so they stay uncached.
const UD_NO_RECORD_CODES = new Set([
  'UnregisteredDomain',
  'UnspecifiedResolver',
  'RecordNotFound',
  'UnsupportedDomain',
  'ReverseResolutionNotSpecified'
])

const reverseLookupUnstoppable = async (
  address: string
): Promise<string | null> => {
  const resolver = getUdResolver()
  if (resolver == null) return null
  try {
    return await resolver.reverse(address)
  } catch (err: unknown) {
    const code =
      err != null && typeof err === 'object' && 'code' in err
        ? String((err as { code: unknown }).code)
        : undefined
    if (code != null && UD_NO_RECORD_CODES.has(code)) return null
    throw err
  }
}

// --- ZNS ---
const reverseLookupZns = async (address: string): Promise<string | null> => {
  return await reverseResolveZnsAddress(address)
}

// --- Cache ---
//
// Process-lifetime cache keyed on pluginId+address. Two important invariants:
//
//  1. Guard on success: only cache outcomes from a fully-successful traversal
//     of the dispatch chain. If ANY service throws (network/rate-limit/etc.)
//     and no positive result was found, we leave the cache empty so the next
//     lookup retries. Caching a `null` from a transient failure would poison
//     the address for the lifetime of the process.
//
//  2. Positive results cache eagerly: as soon as any service returns a name,
//     we cache it and stop traversing further services. The verified ENS
//     name (lookupAddress) takes priority over UD on Ethereum mainnet.
//
// The inflight map dedupes concurrent calls for the same key — useful when
// the same address renders in many transaction-list rows on first paint.
const cache = new Map<string, ReverseLookupResult | null>()
const inflight = new Map<string, Promise<ReverseLookupResult | null>>()

// Bumped on every clear. A `performReverseLookup` that was already in-flight
// when `clearReverseLookupCache` ran (e.g. user logs out mid-lookup) holds a
// reference to the module-level `cache` and would otherwise repopulate it with
// stale entries after the clear. Each lookup captures the epoch at start and
// only commits to `cache` if it still matches, so no entry outlives a
// logout/login cycle (per module-level-cache-bugs rule).
let cacheEpoch = 0

const cacheKey = (pluginId: string, address: string): string =>
  `${pluginId}:${address}`

export const clearReverseLookupCache = (): void => {
  cache.clear()
  inflight.clear()
  cacheEpoch += 1
  // Reset lazily-created service singletons so no provider/resolver internal
  // state outlives a logout/login cycle (per module-level-cache-bugs rule).
  ensProvider = null
  udResolver = null
}

const performReverseLookup = async (
  pluginId: string,
  address: string
): Promise<ReverseLookupResult | null> => {
  const services = getReverseLookupServices(pluginId)
  const epoch = cacheEpoch
  let allServicesSucceeded = true

  for (const service of services) {
    let name: string | null = null
    try {
      switch (service) {
        case 'ens':
          name = await reverseLookupEns(address)
          break
        case 'unstoppable':
          name = await reverseLookupUnstoppable(address)
          break
        case 'zns':
          name = await reverseLookupZns(address)
          break
      }
    } catch (_err: unknown) {
      allServicesSucceeded = false
      continue
    }

    if (name != null) {
      const result: ReverseLookupResult = { name, service }
      if (cacheEpoch === epoch) cache.set(cacheKey(pluginId, address), result)
      return result
    }
  }

  if (allServicesSucceeded && cacheEpoch === epoch) {
    cache.set(cacheKey(pluginId, address), null)
  }
  return null
}

export const reverseLookupName = async (
  pluginId: string,
  address: string
): Promise<ReverseLookupResult | null> => {
  if (address === '') return null
  if (!hasReverseLookupSupport(pluginId)) return null

  const key = cacheKey(pluginId, address)
  if (cache.has(key)) return cache.get(key) ?? null

  let promise = inflight.get(key)
  if (promise == null) {
    promise = performReverseLookup(pluginId, address)
    inflight.set(key, promise)
  }
  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

export const peekReverseLookupCache = (
  pluginId: string,
  address: string | undefined
): ReverseLookupResult | null => {
  if (address == null || address === '') return null
  return cache.get(cacheKey(pluginId, address)) ?? null
}
