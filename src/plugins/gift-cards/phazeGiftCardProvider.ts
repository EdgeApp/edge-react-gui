import { asMaybe, asNumber, asObject, asOptional, asString } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'

import { debugLog } from '../../util/logger'
import { makeUuid } from '../../util/rnUtils'
import {
  makePhazeApi,
  MARKET_LISTING_FIELDS,
  type PhazeApi,
  type PhazeApiConfig
} from './phazeApi'
import {
  makePhazeGiftCardCache,
  type PhazeGiftCardCache
} from './phazeGiftCardCache'
import { saveOrderAugment } from './phazeGiftCardOrderStore'
import {
  cleanBrandName,
  type PhazeCreateOrderRequest,
  type PhazeFxRate,
  type PhazeGiftCardBrand,
  type PhazeGiftCardsResponse,
  type PhazeOrderStatusResponse,
  type PhazeRegisterUserRequest,
  type PhazeRegisterUserResponse,
  type PhazeTokensResponse,
  type PhazeUser
} from './phazeGiftCardTypes'

// dataStore keys - encrypted storage for privacy
const STORE_ID = 'phaze-prod'
// Each identity is stored as a separate item keyed by uniqueId to prevent
// race conditions when multiple devices create identities simultaneously.
const IDENTITY_KEY_PREFIX = 'identity-'

export const hasStoredPhazeIdentity = async (
  account: EdgeAccount
): Promise<boolean> => {
  try {
    const itemIds = await account.dataStore.listItemIds(STORE_ID)
    return itemIds.some(id => id.startsWith(IDENTITY_KEY_PREFIX))
  } catch {
    return false
  }
}

// Cleaner for individual identity storage (PhazeUser fields + uniqueId)
interface StoredIdentity extends PhazeUser {
  uniqueId: string
}
const asStoredIdentity = asObject({
  id: asNumber,
  email: asString,
  firstName: asString,
  lastName: asString,
  userApiKey: asOptional(asString),
  balance: asString,
  balanceCurrency: asString,
  uniqueId: asString
})

/**
 * Clean a brand object by stripping trailing currency symbols from the name.
 */
const cleanBrand = (brand: PhazeGiftCardBrand): PhazeGiftCardBrand => ({
  ...brand,
  brandName: cleanBrandName(brand.brandName)
})

export interface PhazeGiftCardProvider {
  setUserApiKey: (userApiKey: string | undefined) => void

  /**
   * Ensure a Phaze user exists for this Edge account.
   * For full accounts: Auto-generates and registers if no identity exists.
   * For light accounts: Returns false (feature is gated).
   * Returns true if user is ready, false otherwise.
   */
  ensureUser: (account: EdgeAccount) => Promise<boolean>

  /**
   * List all Phaze identities stored for this account.
   * Used for aggregating orders across multiple devices/identities.
   */
  listIdentities: (account: EdgeAccount) => Promise<PhazeUser[]>

  /** Get underlying API instance (for direct API calls) */
  getApi: () => PhazeApi

  /** Get cache instance (for direct cache access) */
  getCache: () => PhazeGiftCardCache

  getTokens: () => Promise<PhazeTokensResponse>
  /**
   * Returns cached FX rates. Rates are automatically fetched and cached
   * when calling getMarketBrands or other brand-fetching methods.
   */
  getCachedFxRates: () => PhazeFxRate[] | null

  // ---------------------------------------------------------------------------
  // Brand fetching - smart methods
  // ---------------------------------------------------------------------------

  /**
   * Get brands for market listing display. Uses minimal fields for fast loading.
   * Stores brands in cache for later lookup.
   */
  getMarketBrands: (countryCode: string) => Promise<PhazeGiftCardBrand[]>

  /**
   * Get full brand details by productId.
   * Returns cached brand if already fetched with full details.
   * Otherwise, fetches full details from API.
   */
  getBrandDetails: (
    countryCode: string,
    productId: number
  ) => Promise<PhazeGiftCardBrand | undefined>

  /**
   * Get a cached brand by productId (no fetch).
   * Returns undefined if brand is not in cache.
   */
  getCachedBrand: (
    countryCode: string,
    productId: number
  ) => PhazeGiftCardBrand | undefined

  /**
   * Store a brand in the cache (for seeding cache from navigation params).
   */
  storeBrand: (countryCode: string, brand: PhazeGiftCardBrand) => void

  // ---------------------------------------------------------------------------
  // Order methods
  // ---------------------------------------------------------------------------

  /**
   * Fetch order status from Phaze API (for current userApiKey).
   */
  getOrderStatus: (params?: {
    quoteId?: string
    currentPage?: number
  }) => Promise<PhazeOrderStatusResponse>

  /**
   * Fetch orders from ALL identities stored for this account.
   * Used in GiftCardListScene to aggregate orders across multi-device scenarios.
   */
  getAllOrdersFromAllIdentities: (
    account: EdgeAccount
  ) => Promise<PhazeOrderStatusResponse['data']>

  /**
   * Create an order quote with Phaze API.
   * Returns the API response - does NOT persist anything locally.
   */
  createOrder: (
    body: PhazeCreateOrderRequest
  ) => ReturnType<PhazeApi['createOrder']>

  /**
   * Save order augment after broadcast (tx link + brand/amount info).
   * This is the only local persistence for orders.
   */
  saveOrderAugment: (
    account: EdgeAccount,
    orderId: string,
    augment: {
      walletId: string
      tokenId: string | null
      txid: string
      brandName: string
      brandImage: string
      fiatAmount: number
      fiatCurrency: string
    }
  ) => Promise<void>

  // ---------------------------------------------------------------------------
  // Legacy methods (still used for specific cases)
  // ---------------------------------------------------------------------------

  getGiftCards: (params: {
    countryCode: string
    currentPage?: number
    perPage?: number
    brandName?: string
  }) => Promise<PhazeGiftCardsResponse>
  getFullGiftCards: (params: {
    countryCode: string
    /** Comma-separated list of fields to return (reduces payload size) */
    fields?: string
    /** Filter expression (e.g., "categories=pets") */
    filter?: string
  }) => Promise<PhazeGiftCardsResponse>
  getUserByEmail: (email: string) => Promise<PhazeUser | undefined>
  registerUser: (
    body: PhazeRegisterUserRequest
  ) => Promise<PhazeRegisterUserResponse>
  /**
   * Get or create a user. Tries to lookup by email first; if not found,
   * registers a new user. Handles multi-device scenarios seamlessly.
   */
  getOrCreateUser: (
    body: PhazeRegisterUserRequest
  ) => Promise<PhazeRegisterUserResponse>
}

export const makePhazeGiftCardProvider = (
  config: PhazeApiConfig
): PhazeGiftCardProvider => {
  const api = makePhazeApi(config)
  const cache = makePhazeGiftCardCache()

  /**
   * Load all stored identities from encrypted dataStore.
   * Each identity is stored as a separate item keyed by uniqueId, preventing
   * race conditions when multiple devices create identities simultaneously.
   */
  const loadIdentities = async (
    account: EdgeAccount
  ): Promise<StoredIdentity[]> => {
    try {
      const itemIds = await account.dataStore.listItemIds(STORE_ID)
      const identityKeys = itemIds.filter(id =>
        id.startsWith(IDENTITY_KEY_PREFIX)
      )

      const identities: StoredIdentity[] = []
      for (const key of identityKeys) {
        try {
          const text = await account.dataStore.getItem(STORE_ID, key)
          const parsed = asMaybe(asStoredIdentity)(JSON.parse(text))
          if (parsed != null) {
            identities.push(parsed)
          }
        } catch {
          // Skip malformed identity entries
        }
      }

      debugLog('phaze', 'Loaded identities:', identities)
      return identities
    } catch {
      return []
    }
  }

  /**
   * Save a single identity to encrypted dataStore using its uniqueId as the key.
   * This prevents race conditions - each device writes to its own unique key.
   */
  const saveIdentity = async (
    account: EdgeAccount,
    identity: StoredIdentity
  ): Promise<void> => {
    const key = `${IDENTITY_KEY_PREFIX}${identity.uniqueId}`
    await account.dataStore.setItem(STORE_ID, key, JSON.stringify(identity))
  }

  return {
    setUserApiKey: userApiKey => {
      api.setUserApiKey(userApiKey)
    },

    async ensureUser(account) {
      // Light accounts cannot use gift cards
      if (account.username == null) {
        debugLog('phaze', 'Light account - gift cards not available')
        return false
      }

      // Pre-fetch FX rates so they're available for brand filtering and
      // minimum amount display. This runs in parallel with identity loading.
      const fxRatesPromise = api.ensureFxRates().catch((err: unknown) => {
        debugLog('phaze', 'Failed to pre-fetch FX rates:', err)
      })

      // Check for existing identities. Uses the first identity found for purchases/orders.
      // Multiple identities is an edge case (multi-device before sync completes) -
      // new orders simply go to whichever identity is active.
      // Order VIEWING aggregates all identities via getAllOrdersFromAllIdentities().
      const identities = await loadIdentities(account)

      for (const identity of identities) {
        if (identity.userApiKey != null) {
          api.setUserApiKey(identity.userApiKey)
          debugLog('phaze', 'Using existing identity:', identity.uniqueId)
          await fxRatesPromise
          return true
        }
      }

      // No existing identity found - auto-generate one
      debugLog('phaze', 'No identity found, auto-generating...')

      // Generate unique email prefix
      const uniqueId = await makeUuid()
      const email = `${uniqueId}@edge.app`

      // Auto-generate registration data
      const firstName = 'Edgeuser'
      const lastName = account.username

      try {
        // Register with Phaze API (or get existing if email already registered)
        const response = await api.registerUser({
          email,
          firstName,
          lastName
        })

        const userApiKey = response.data.userApiKey
        if (userApiKey == null) {
          debugLog('phaze', 'Registration succeeded but no userApiKey returned')
          return false
        }

        // Save identity to its own unique key in encrypted dataStore
        const newIdentity: StoredIdentity = {
          ...response.data,
          uniqueId
        }
        await saveIdentity(account, newIdentity)

        api.setUserApiKey(userApiKey)
        debugLog('phaze', 'Auto-registered and saved identity:', uniqueId)
        await fxRatesPromise
        return true
      } catch (err: unknown) {
        debugLog('phaze', 'Auto-registration failed:', err)
        return false
      }
    },

    async listIdentities(account) {
      return await loadIdentities(account)
    },

    getApi: () => api,
    getCache: () => cache,

    getTokens: async () => {
      return await api.getTokens()
    },

    getCachedFxRates: () => {
      return api.getCachedFxRates()
    },

    // ---------------------------------------------------------------------------
    // Brand fetching - smart methods
    // ---------------------------------------------------------------------------

    async getMarketBrands(countryCode: string) {
      // Fetch all brands with minimal fields for fast market display
      const response = await api.getFullGiftCards({
        countryCode,
        fields: MARKET_LISTING_FIELDS
      })

      // Clean brands
      const cleanedBrands = response.brands.map(cleanBrand)

      // Store in cache (preserves existing full-detail brands)
      cache.setBrands(countryCode, cleanedBrands)

      // Persist to disk
      cache.saveToDisk(countryCode).catch((err: unknown) => {
        debugLog('phaze', 'Failed to persist brand cache:', err)
      })

      return cleanedBrands
    },

    async getBrandDetails(countryCode: string, productId: number) {
      // Check if we already have full details in cache
      if (cache.hasFullDetails(countryCode, productId)) {
        const cached = cache.getBrand(countryCode, productId)
        if (cached != null) {
          debugLog('phaze', 'Using cached full brand details for:', productId)
          return cached
        }
      }

      // Get cached brand for name lookup
      const cached = cache.getBrand(countryCode, productId)
      const brandName = cached?.brandName
      if (brandName == null) {
        debugLog(
          'phaze',
          'Brand not in cache, cannot fetch details:',
          productId
        )
        return undefined
      }

      // Fetch full details for this brand by name
      debugLog('phaze', 'Fetching full brand details for:', brandName)
      const response = await api.getGiftCards({
        countryCode,
        brandName,
        perPage: 1
      })

      if (response.brands.length > 0) {
        const fullBrand = cleanBrand(response.brands[0])
        cache.setBrandWithFullDetails(countryCode, fullBrand)

        // Persist to disk
        cache.saveToDisk(countryCode).catch((err: unknown) => {
          debugLog('phaze', 'Failed to persist brand cache:', err)
        })

        return fullBrand
      }

      return cached
    },

    getCachedBrand(countryCode: string, productId: number) {
      return cache.getBrand(countryCode, productId)
    },

    storeBrand(countryCode: string, brand: PhazeGiftCardBrand) {
      // Only store if not already in cache (don't overwrite full details)
      if (cache.getBrand(countryCode, brand.productId) == null) {
        const cleaned = cleanBrand(brand)
        cache.setBrands(countryCode, [cleaned])
      }
    },

    // ---------------------------------------------------------------------------
    // Order methods
    // ---------------------------------------------------------------------------

    async getOrderStatus(params = {}) {
      return await api.getOrderStatus(params)
    },

    async getAllOrdersFromAllIdentities(account) {
      const identities = await this.listIdentities(account)
      const allOrders: PhazeOrderStatusResponse['data'] = []
      const seenQuoteIds = new Set<string>()

      // Save current userApiKey to restore later
      const currentKey = api.getUserApiKey()

      for (const identity of identities) {
        if (identity.userApiKey == null) {
          continue
        }

        try {
          // Temporarily set the API key for this identity
          api.setUserApiKey(identity.userApiKey)
          const response = await api.getOrderStatus({})

          // Add unique orders (avoid duplicates if somehow shared)
          for (const order of response.data) {
            if (!seenQuoteIds.has(order.quoteId)) {
              seenQuoteIds.add(order.quoteId)
              allOrders.push(order)
            }
          }
        } catch (err: unknown) {
          // Log error but continue with other identities
          debugLog('phaze', 'Error fetching orders for identity:', err)
        }
      }

      // Restore original userApiKey
      api.setUserApiKey(currentKey)

      return allOrders
    },

    async createOrder(body) {
      return await api.createOrder(body)
    },

    async saveOrderAugment(account, orderId, augment) {
      await saveOrderAugment(account, orderId, {
        walletId: augment.walletId,
        tokenId: augment.tokenId ?? undefined,
        txid: augment.txid,
        brandName: augment.brandName,
        brandImage: augment.brandImage,
        fiatAmount: augment.fiatAmount,
        fiatCurrency: augment.fiatCurrency
      })
    },

    // ---------------------------------------------------------------------------
    // Legacy methods
    // ---------------------------------------------------------------------------

    getGiftCards: async params => {
      return await api.getGiftCards(params)
    },
    getFullGiftCards: async params => {
      return await api.getFullGiftCards(params)
    },
    getUserByEmail: async email => {
      try {
        const response = await api.getUserByEmail(email)
        const userApiKey = response.data.userApiKey
        if (userApiKey != null) api.setUserApiKey(userApiKey)
        return response.data
      } catch (err: unknown) {
        // 401 "Partner user not found." means user doesn't exist
        if (
          err instanceof Error &&
          err.message.includes('Partner user not found')
        ) {
          return undefined
        }
        throw err
      }
    },
    registerUser: async body => {
      const response = await api.registerUser(body)
      const userApiKey = response.data.userApiKey
      if (userApiKey != null) api.setUserApiKey(userApiKey)
      return response
    },
    getOrCreateUser: async body => {
      // First, try to lookup existing user by email
      try {
        const existingUser = await api.getUserByEmail(body.email)
        const userApiKey = existingUser.data.userApiKey
        if (userApiKey != null) api.setUserApiKey(userApiKey)
        return existingUser
      } catch (err: unknown) {
        // 401 "Partner user not found." means user doesn't exist - proceed to register
        if (
          !(
            err instanceof Error &&
            err.message.includes('Partner user not found')
          )
        ) {
          throw err
        }
      }
      // User doesn't exist, register them
      const response = await api.registerUser(body)
      const userApiKey = response.data.userApiKey
      if (userApiKey != null) api.setUserApiKey(userApiKey)
      return response
    }
  }
}
