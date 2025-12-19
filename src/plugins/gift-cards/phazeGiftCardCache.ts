import { asArray, asNumber, asObject, asString } from 'cleaners'
import type { Disklet } from 'disklet'
import { makeReactNativeDisklet, navigateDisklet } from 'disklet'

import { debugLog } from '../../util/logger'
import {
  asPhazeGiftCardBrand,
  type PhazeGiftCardBrand
} from './phazeGiftCardTypes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry {
  timestamp: number
  /** Map of productId -> brand for O(1) lookup */
  brandsByProductId: Map<number, PhazeGiftCardBrand>
  /** Set of productIds that have full details (not just market listing fields) */
  fullDetailProductIds: Set<number>
}

/**
 * Disk-persisted cache file structure for a single country's gift cards.
 */
const asPhazeGiftCardCacheFile = asObject({
  version: asNumber,
  timestamp: asNumber,
  countryCode: asString,
  brands: asArray(asPhazeGiftCardBrand),
  /** ProductIds that have been fetched with full details */
  fullDetailProductIds: asArray(asNumber)
})
type PhazeGiftCardCacheFile = ReturnType<typeof asPhazeGiftCardCacheFile>

export interface PhazeGiftCardCache {
  /**
   * Get all cached brands for a country as an array (for listing).
   * Returns undefined if cache is stale or doesn't exist.
   */
  getBrands: (countryCode: string) => PhazeGiftCardBrand[] | undefined

  /**
   * Get a single brand by productId (for detail lookup).
   * Returns undefined if not in cache.
   */
  getBrand: (
    countryCode: string,
    productId: number
  ) => PhazeGiftCardBrand | undefined

  /**
   * Check if a brand has full details (not just market listing fields).
   */
  hasFullDetails: (countryCode: string, productId: number) => boolean

  /**
   * Set cached brands for a country. Replaces existing cache.
   * @param fullDetailProductIds - Optional set of productIds that have full details
   */
  setBrands: (
    countryCode: string,
    brands: PhazeGiftCardBrand[],
    fullDetailProductIds?: Set<number>
  ) => void

  /**
   * Update a single brand with full details.
   */
  setBrandWithFullDetails: (
    countryCode: string,
    brand: PhazeGiftCardBrand
  ) => void

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

const CACHE_VERSION = 2 // Bumped for new structure
const CACHE_DISKLET_DIR = 'phazeGiftCards'

/**
 * In-memory cache TTL (1 hour).
 * Brand data changes infrequently, so a longer TTL reduces API calls while
 * still providing reasonably fresh data.
 */
const MEMORY_CACHE_TTL_MS = 60 * 60 * 1000

/**
 * Disk cache TTL (24 hours).
 * Used for offline/startup scenarios. Stale data is better than no data.
 */
const DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Module-level singleton cache
// ---------------------------------------------------------------------------

/**
 * Module-level in-memory cache. Brands are the same for all users,
 * so this is keyed only by countryCode (not accountId).
 */
const globalMemoryCache = new Map<string, CacheEntry>()

/**
 * Global disklet for persistence. Brands are not account-specific so we use
 * a global disklet rather than account.localDisklet.
 */
const globalDisklet: Disklet = navigateDisklet(
  makeReactNativeDisklet(),
  CACHE_DISKLET_DIR
)

// ---------------------------------------------------------------------------
// Direct memory cache access (for synchronous initial state)
// ---------------------------------------------------------------------------

/**
 * Read brands directly from memory cache without needing account/disklet.
 * Useful for synchronous initial state in React components.
 * Returns undefined if cache is empty or expired.
 */
export const getCachedBrandsSync = (
  countryCode: string
): PhazeGiftCardBrand[] | undefined => {
  const entry = globalMemoryCache.get(countryCode)
  if (entry == null) return undefined

  // Check if cache is still valid
  const age = Date.now() - entry.timestamp
  if (age > MEMORY_CACHE_TTL_MS) {
    globalMemoryCache.delete(countryCode)
    return undefined
  }

  return Array.from(entry.brandsByProductId.values())
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create or return the singleton brand cache.
 * Brand data is not account-specific, so this uses a global disklet.
 */
export const makePhazeGiftCardCache = (): PhazeGiftCardCache => {
  const getCacheFilename = (countryCode: string): string =>
    `brands-${countryCode.toLowerCase()}.json`

  return {
    getBrands(countryCode: string): PhazeGiftCardBrand[] | undefined {
      const entry = globalMemoryCache.get(countryCode)
      if (entry == null) {
        return undefined
      }

      // Check if cache is still valid
      const age = Date.now() - entry.timestamp
      if (age > MEMORY_CACHE_TTL_MS) {
        globalMemoryCache.delete(countryCode)
        return undefined
      }

      return Array.from(entry.brandsByProductId.values())
    },

    getBrand(
      countryCode: string,
      productId: number
    ): PhazeGiftCardBrand | undefined {
      const entry = globalMemoryCache.get(countryCode)
      if (entry == null) {
        return undefined
      }

      // Check if cache is still valid
      const age = Date.now() - entry.timestamp
      if (age > MEMORY_CACHE_TTL_MS) {
        globalMemoryCache.delete(countryCode)
        return undefined
      }

      return entry.brandsByProductId.get(productId)
    },

    hasFullDetails(countryCode: string, productId: number): boolean {
      const entry = globalMemoryCache.get(countryCode)
      return entry?.fullDetailProductIds.has(productId) ?? false
    },

    setBrands(
      countryCode: string,
      brands: PhazeGiftCardBrand[],
      fullDetailProductIds?: Set<number>
    ): void {
      const existingEntry = globalMemoryCache.get(countryCode)

      // Build new brandsByProductId map
      const brandsByProductId = new Map<number, PhazeGiftCardBrand>()
      for (const brand of brands) {
        // Don't overwrite existing brands that have full details
        const existingBrand = existingEntry?.brandsByProductId.get(
          brand.productId
        )
        const existingHasFullDetails =
          existingEntry?.fullDetailProductIds.has(brand.productId) ?? false

        if (existingBrand != null && existingHasFullDetails) {
          brandsByProductId.set(brand.productId, existingBrand)
        } else {
          brandsByProductId.set(brand.productId, brand)
        }
      }

      // Merge fullDetailProductIds
      const mergedFullDetails = new Set<number>(
        existingEntry?.fullDetailProductIds
      )
      if (fullDetailProductIds != null) {
        for (const id of fullDetailProductIds) {
          mergedFullDetails.add(id)
        }
      }

      globalMemoryCache.set(countryCode, {
        timestamp: Date.now(),
        brandsByProductId,
        fullDetailProductIds: mergedFullDetails
      })
    },

    setBrandWithFullDetails(
      countryCode: string,
      brand: PhazeGiftCardBrand
    ): void {
      const entry = globalMemoryCache.get(countryCode)
      if (entry == null) {
        // Create new entry with just this brand
        globalMemoryCache.set(countryCode, {
          timestamp: Date.now(),
          brandsByProductId: new Map([[brand.productId, brand]]),
          fullDetailProductIds: new Set([brand.productId])
        })
      } else {
        // Update existing entry
        entry.brandsByProductId.set(brand.productId, brand)
        entry.fullDetailProductIds.add(brand.productId)
        entry.timestamp = Date.now()
      }
    },

    async loadFromDisk(
      countryCode: string
    ): Promise<PhazeGiftCardBrand[] | undefined> {
      if (globalDisklet == null) return undefined

      try {
        const filename = getCacheFilename(countryCode)
        const text = await globalDisklet.getText(filename)
        const cacheFile = asPhazeGiftCardCacheFile(JSON.parse(text))

        // Check version compatibility
        if (cacheFile.version !== CACHE_VERSION) {
          debugLog('phaze', 'Cache version mismatch, ignoring disk cache')
          return undefined
        }

        // Check if disk cache is still valid
        if (Date.now() - cacheFile.timestamp > DISK_CACHE_TTL_MS) {
          debugLog('phaze', 'Disk cache expired for', countryCode)
          return undefined
        }

        debugLog(
          'phaze',
          'Loaded',
          cacheFile.brands.length,
          'brands from disk for',
          countryCode
        )

        // Populate memory cache
        const brandsByProductId = new Map<number, PhazeGiftCardBrand>()
        for (const brand of cacheFile.brands) {
          brandsByProductId.set(brand.productId, brand)
        }

        globalMemoryCache.set(countryCode, {
          timestamp: cacheFile.timestamp,
          brandsByProductId,
          fullDetailProductIds: new Set(cacheFile.fullDetailProductIds)
        })

        return cacheFile.brands
      } catch (err: unknown) {
        // File doesn't exist or parse error - that's fine
        return undefined
      }
    },

    async saveToDisk(countryCode: string): Promise<void> {
      if (globalDisklet == null) return

      const entry = globalMemoryCache.get(countryCode)
      if (entry == null) return

      try {
        const cacheFile: PhazeGiftCardCacheFile = {
          version: CACHE_VERSION,
          timestamp: entry.timestamp,
          countryCode,
          brands: Array.from(entry.brandsByProductId.values()),
          fullDetailProductIds: Array.from(entry.fullDetailProductIds)
        }
        const filename = getCacheFilename(countryCode)
        await globalDisklet.setText(filename, JSON.stringify(cacheFile))
        debugLog(
          'phaze',
          'Saved',
          entry.brandsByProductId.size,
          'brands to disk for',
          countryCode
        )
      } catch (err: unknown) {
        debugLog('phaze', 'Failed to save to disk:', err)
      }
    },

    clear(countryCode?: string): void {
      if (countryCode != null) {
        globalMemoryCache.delete(countryCode)
      } else {
        globalMemoryCache.clear()
      }
    }
  }
}
