import type { EdgeAccount } from 'edge-core-js'

import { getDiskletFormData, setDiskletForm } from '../../util/formUtils'
import { debugLog } from '../../util/logger'
import { makeUuid } from '../../util/rnUtils'
import {
  makePhazeApi,
  MARKET_LISTING_FIELDS,
  type PhazeApi,
  type PhazeApiConfig
} from './phazeApi'
import { saveOrderAugment } from './phazeGiftCardOrderStore'
import {
  asPhazeUser,
  cleanBrandName,
  getPhazeIdentityFilename,
  parsePhazeDiskletFilename,
  PHAZE_IDENTITY_DISKLET_NAME,
  type PhazeCreateOrderRequest,
  type PhazeGiftCardBrand,
  type PhazeGiftCardsResponse,
  type PhazeOrderStatusResponse,
  type PhazeRegisterUserRequest,
  type PhazeRegisterUserResponse,
  type PhazeTokensResponse,
  type PhazeUser
} from './phazeGiftCardTypes'

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

  getTokens: () => Promise<PhazeTokensResponse>

  // ---------------------------------------------------------------------------
  // Brand fetching - smart methods
  // ---------------------------------------------------------------------------

  /**
   * Get brands for market listing display. Uses minimal fields for fast loading.
   * Stores brands internally for later lookup.
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
  getCachedBrand: (productId: number) => PhazeGiftCardBrand | undefined

  /**
   * Store brands in the internal cache.
   * If mergeOnly=true, won't overwrite existing brands with full data.
   */
  storeBrands: (brands: PhazeGiftCardBrand[], mergeOnly?: boolean) => void

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

/**
 * Helper to check if a brand has full details (not just market listing fields).
 */
const brandHasFullDetails = (brand: PhazeGiftCardBrand): boolean => {
  // productDescription is required for purchase scene - if it exists (even empty
  // string), the brand has been fetched with full details
  return brand.productDescription !== undefined
}

// Module-level brand cache - persists across provider instances so cached
// descriptions aren't lost when navigating between scenes
const globalBrandStore = new Map<number, PhazeGiftCardBrand>()
const globalFullDetailBrands = new Set<number>()

export const makePhazeGiftCardProvider = (
  config: PhazeApiConfig
): PhazeGiftCardProvider => {
  const api = makePhazeApi(config)

  // Use global brand store to persist across provider instances
  const brandStore = globalBrandStore
  const fullDetailBrands = globalFullDetailBrands

  /**
   * List all Phaze identity files in the account disklet.
   */
  const listIdentityFiles = async (account: EdgeAccount): Promise<string[]> => {
    const listing = await account.disklet.list()
    const identityFiles: string[] = []

    for (const [filename, type] of Object.entries(listing)) {
      if (type !== 'file') continue
      // Check for new pattern
      if (parsePhazeDiskletFilename(filename) != null) {
        identityFiles.push(filename)
      }
      // Check for legacy pattern
      if (filename === PHAZE_IDENTITY_DISKLET_NAME) {
        identityFiles.push(filename)
      }
    }

    return identityFiles
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

      // Check for existing identities (new pattern first, then legacy)
      const identityFiles = await listIdentityFiles(account)

      for (const filename of identityFiles) {
      const user = await getDiskletFormData(
        account.disklet,
          filename,
        asPhazeUser
      )
      if (user?.userApiKey != null) {
        api.setUserApiKey(user.userApiKey)
          debugLog('phaze', 'Using existing identity from:', filename)
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

        // Save to new identity file
        const filename = getPhazeIdentityFilename(uniqueId)
        await setDiskletForm(account.disklet, filename, response.data)

        api.setUserApiKey(userApiKey)
        debugLog('phaze', 'Auto-registered and saved identity to:', filename)
        return true
      } catch (err: unknown) {
        debugLog('phaze', 'Auto-registration failed:', err)
      return false
      }
    },

    async listIdentities(account) {
      const identityFiles = await listIdentityFiles(account)
      const identities: PhazeUser[] = []

      for (const filename of identityFiles) {
        const user = await getDiskletFormData(
          account.disklet,
          filename,
          asPhazeUser
        )
        if (user != null) {
          identities.push(user)
        }
      }

      return identities
    },

    getApi: () => api,

    getTokens: async () => {
      return await api.getTokens()
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

      // Clean and store brands (don't overwrite existing full-detail brands)
      const cleanedBrands = response.brands.map(cleanBrand)
      for (const brand of cleanedBrands) {
        if (!fullDetailBrands.has(brand.productId)) {
          brandStore.set(brand.productId, brand)
        }
      }

      return cleanedBrands
    },

    async getBrandDetails(countryCode: string, productId: number) {
      // Check if we already have full details
      const cached = brandStore.get(productId)
      if (cached != null && brandHasFullDetails(cached)) {
        debugLog('phaze', 'Using cached full brand details for:', productId)
        return cached
      }

      // Fetch full details for this brand by name
      const brandName = cached?.brandName
      if (brandName == null) {
        debugLog('phaze', 'Brand not in store, cannot fetch details:', productId)
        return undefined
      }

      debugLog('phaze', 'Fetching full brand details for:', brandName)
      const response = await api.getGiftCards({
        countryCode,
        brandName,
        perPage: 1
      })

      if (response.brands.length > 0) {
        const fullBrand = cleanBrand(response.brands[0])
        brandStore.set(fullBrand.productId, fullBrand)
        fullDetailBrands.add(fullBrand.productId)
        return fullBrand
      }

      return cached
    },

    getCachedBrand(productId: number) {
      return brandStore.get(productId)
    },

    storeBrands(brands: PhazeGiftCardBrand[], mergeOnly = false) {
      for (const brand of brands) {
        if (mergeOnly && brandStore.has(brand.productId)) {
          // Skip - already have this brand
          continue
        }
        const cleaned = cleanBrand(brand)
        brandStore.set(cleaned.productId, cleaned)
        if (brandHasFullDetails(cleaned)) {
          fullDetailBrands.add(cleaned.productId)
        }
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
