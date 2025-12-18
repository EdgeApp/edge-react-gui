import { asArray, asNumber, asObject, asString } from 'cleaners'
import type { Disklet } from 'disklet'
import { navigateDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'

import {
  asPhazeGiftCardBrand,
  type PhazeGiftCardBrand
} from './phazeGiftCardTypes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Disk-persisted cache file structure for a single country's gift cards.
 * Uses minimal fields to reduce storage size.
 */
const asPhazeGiftCardCacheFile = asObject({
  version: asNumber,
  timestamp: asNumber,
  countryCode: asString,
  brands: asArray(asPhazeGiftCardBrand)
})
type PhazeGiftCardCacheFile = ReturnType<typeof asPhazeGiftCardCacheFile>

export interface PhazeGiftCardCache {
  /**
   * Get cached brands for a country. Returns undefined if cache is stale or
   * doesn't exist.
   */
  get: (countryCode: string) => PhazeGiftCardBrand[] | undefined

  /**
   * Set cached brands for a country.
   */
  set: (countryCode: string, brands: PhazeGiftCardBrand[]) => void

  /**
   * Load cache from disk for a country (call on startup).
   * Returns brands if found and not expired, undefined otherwise.
   */
  loadFromDisk: (
    countryCode: string
  ) => Promise<PhazeGiftCardBrand[] | undefined>

  /**
   * Persist current cache to disk for a country.
   */
  saveToDisk: (countryCode: string) => Promise<void>

  /**
   * Clear cache for a specific country or all countries.
   */
  clear: (countryCode?: string) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_VERSION = 1
const CACHE_DISKLET_DIR = 'phazeGiftCards'

/**
 * In-memory cache TTL (5 minutes).
 * Short enough to get fresh data regularly, long enough to avoid redundant
 * fetches during normal browsing.
 */
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Disk cache TTL (24 hours).
 * Used for offline/startup scenarios. Stale data is better than no data.
 */
const DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Module-level singleton cache
// ---------------------------------------------------------------------------

/**
 * Module-level in-memory cache that persists across component mounts.
 * Keyed by account ID to support multiple accounts.
 */
const globalMemoryCache = new Map<
  string,
  Map<string, CacheEntry<PhazeGiftCardBrand[]>>
>()

/**
 * Get or create the memory cache for a specific account.
 */
const getAccountMemoryCache = (
  accountId: string
): Map<string, CacheEntry<PhazeGiftCardBrand[]>> => {
  let cache = globalMemoryCache.get(accountId)
  if (cache == null) {
    cache = new Map()
    globalMemoryCache.set(accountId, cache)
  }
  return cache
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const makePhazeGiftCardCache = (
  account: EdgeAccount
): PhazeGiftCardCache => {
  // Use module-level cache keyed by account ID
  const memoryCache = getAccountMemoryCache(account.id)

  // Disklet for persistence
  const disklet: Disklet = navigateDisklet(account.disklet, CACHE_DISKLET_DIR)

  const getCacheFilename = (countryCode: string): string =>
    `brands-${countryCode.toLowerCase()}.json`

  return {
    get(countryCode: string): PhazeGiftCardBrand[] | undefined {
      const entry = memoryCache.get(countryCode)
      if (entry == null) {
        return undefined
      }

      // Check if cache is still valid
      const age = Date.now() - entry.timestamp
      if (age > MEMORY_CACHE_TTL_MS) {
        memoryCache.delete(countryCode)
        return undefined
      }

      return entry.data
    },

    set(countryCode: string, brands: PhazeGiftCardBrand[]): void {
      memoryCache.set(countryCode, {
        data: brands,
        timestamp: Date.now()
      })
    },

    async loadFromDisk(
      countryCode: string
    ): Promise<PhazeGiftCardBrand[] | undefined> {
      try {
        const filename = getCacheFilename(countryCode)
        const text = await disklet.getText(filename)
        const cacheFile = asPhazeGiftCardCacheFile(JSON.parse(text))

        // Check version compatibility
        if (cacheFile.version !== CACHE_VERSION) {
          console.log(
            '[PhazeCache] Cache version mismatch, ignoring disk cache'
          )
          return undefined
        }

        // Check if disk cache is still valid
        if (Date.now() - cacheFile.timestamp > DISK_CACHE_TTL_MS) {
          console.log('[PhazeCache] Disk cache expired for', countryCode)
          return undefined
        }

        console.log(
          '[PhazeCache] Loaded',
          cacheFile.brands.length,
          'brands from disk for',
          countryCode
        )

        // Also populate memory cache
        memoryCache.set(countryCode, {
          data: cacheFile.brands,
          timestamp: cacheFile.timestamp
        })

        return cacheFile.brands
      } catch (err: unknown) {
        // File doesn't exist or parse error - that's fine
        return undefined
      }
    },

    async saveToDisk(countryCode: string): Promise<void> {
      const entry = memoryCache.get(countryCode)
      if (entry == null) return

      try {
        const cacheFile: PhazeGiftCardCacheFile = {
          version: CACHE_VERSION,
          timestamp: entry.timestamp,
          countryCode,
          brands: entry.data
        }
        const filename = getCacheFilename(countryCode)
        await disklet.setText(filename, JSON.stringify(cacheFile))
        console.log(
          '[PhazeCache] Saved',
          entry.data.length,
          'brands to disk for',
          countryCode
        )
      } catch (err: unknown) {
        console.log('[PhazeCache] Failed to save to disk:', err)
      }
    },

    clear(countryCode?: string): void {
      if (countryCode != null) {
        memoryCache.delete(countryCode)
      } else {
        memoryCache.clear()
      }
    }
  }
}
