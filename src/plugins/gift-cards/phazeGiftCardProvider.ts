import type { EdgeAccount } from 'edge-core-js'

import { getDiskletFormData } from '../../util/formUtils'
import {
  makePhazeApi,
  MARKET_LISTING_FIELDS,
  type PhazeApiConfig
} from './phazeApi'
import {
  createStoredOrder,
  savePhazeOrder,
  upsertPhazeOrderIndex
} from './phazeGiftCardOrderStore'
import {
  asPhazeUser,
  PHAZE_IDENTITY_DISKLET_NAME,
  type PhazeCreateOrderRequest,
  type PhazeGiftCardBrand,
  type PhazeGiftCardsResponse,
  type PhazeRegisterUserRequest,
  type PhazeRegisterUserResponse,
  type PhazeStoredOrder,
  type PhazeTokensResponse,
  type PhazeUser
} from './phazeGiftCardTypes'

export interface PhazeGiftCardProvider {
  setUserApiKey: (userApiKey: string | undefined) => void
  ensureUser: (account: EdgeAccount) => Promise<boolean>

  getTokens: () => Promise<PhazeTokensResponse>

  // ---------------------------------------------------------------------------
  // Brand fetching - new smart methods
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

  /**
   * Create an order quote with Phaze API. Does NOT persist the order locally.
   * Call `saveCompletedOrder` after the transaction is broadcast to persist.
   */
  createOrder: (
    account: EdgeAccount,
    body: PhazeCreateOrderRequest,
    brand: PhazeGiftCardBrand,
    fiatAmount: number
  ) => Promise<PhazeStoredOrder>

  /**
   * Save a completed order after broadcast, including transaction details.
   * This is the only way to persist an order - ensures we only store
   * orders that were actually paid for.
   */
  saveCompletedOrder: (
    account: EdgeAccount,
    order: PhazeStoredOrder,
    walletId: string,
    tokenId: string | null,
    txid: string
  ) => Promise<PhazeStoredOrder>
}

/**
 * Helper to check if a brand has full details (not just market listing fields).
 */
const brandHasFullDetails = (brand: PhazeGiftCardBrand): boolean => {
  // productDescription is required for purchase scene - if it exists (even empty
  // string), the brand has been fetched with full details
  return brand.productDescription !== undefined
}

export const makePhazeGiftCardProvider = (
  config: PhazeApiConfig
): PhazeGiftCardProvider => {
  const api = makePhazeApi(config)

  // Internal brand store: productId -> brand data
  const brandStore = new Map<number, PhazeGiftCardBrand>()

  // Track which brands have full details
  const fullDetailBrands = new Set<number>()

  return {
    setUserApiKey: userApiKey => {
      api.setUserApiKey(userApiKey)
    },

    async ensureUser(account) {
      const user = await getDiskletFormData(
        account.disklet,
        PHAZE_IDENTITY_DISKLET_NAME,
        asPhazeUser
      )
      if (user?.userApiKey != null) {
        api.setUserApiKey(user.userApiKey)
        return true
      }
      return false
    },

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

      // Store brands (don't overwrite existing full-detail brands)
      for (const brand of response.brands) {
        if (!fullDetailBrands.has(brand.productId)) {
          brandStore.set(brand.productId, brand)
        }
      }

      return response.brands
    },

    async getBrandDetails(countryCode: string, productId: number) {
      // Check if we already have full details
      const cached = brandStore.get(productId)
      if (cached != null && brandHasFullDetails(cached)) {
        console.log('[Phaze] Using cached full brand details for:', productId)
        return cached
      }

      // Fetch full details for this brand by name
      const brandName = cached?.brandName
      if (brandName == null) {
        console.log(
          '[Phaze] Brand not in store, cannot fetch details:',
          productId
        )
        return undefined
      }

      console.log('[Phaze] Fetching full brand details for:', brandName)
      const response = await api.getGiftCards({
        countryCode,
        brandName,
        perPage: 1
      })

      if (response.brands.length > 0) {
        const fullBrand = response.brands[0]
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
        brandStore.set(brand.productId, brand)
        if (brandHasFullDetails(brand)) {
          fullDetailBrands.add(brand.productId)
        }
      }
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
    },

    async createOrder(account, body, brand, fiatAmount) {
      const orderResponse = await api.createOrder(body)
      // Create stored order with brand info but do NOT persist yet.
      // Order will only be persisted after successful transaction broadcast.
      const storedOrder = createStoredOrder(orderResponse, brand, fiatAmount)
      return storedOrder
    },

    async saveCompletedOrder(account, order, walletId, tokenId, txid) {
      // Add transaction details to the order
      const completedOrder: PhazeStoredOrder = {
        ...order,
        walletId,
        tokenId: tokenId ?? undefined,
        txid
      }
      // Now persist the completed order
      await savePhazeOrder(account, completedOrder)
      await upsertPhazeOrderIndex(account, completedOrder.quoteId)
      return completedOrder
    }
  }
}
