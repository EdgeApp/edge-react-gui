import type { EdgeAccount } from 'edge-core-js'

import { getDiskletFormData } from '../../util/formUtils'
import { makePhazeApi, type PhazeApiConfig } from './phazeApi'
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

export const makePhazeGiftCardProvider = (
  config: PhazeApiConfig
): PhazeGiftCardProvider => {
  const api = makePhazeApi(config)

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
