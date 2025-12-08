import type { EdgeAccount } from 'edge-core-js'

import { getDiskletFormData } from '../../util/formUtils'
import { makePhazeApi, type PhazeApiConfig } from './phazeApi'
import {
  savePhazeOrder,
  upsertPhazeOrderIndex
} from './phazeGiftCardOrderStore'
import {
  asPhazeUser,
  PHAZE_IDENTITY_DISKLET_NAME,
  type PhazeCreateOrderRequest,
  type PhazeCreateOrderResponse,
  type PhazeGiftCardsResponse,
  type PhazeRegisterUserRequest,
  type PhazeRegisterUserResponse,
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

  createOrder: (
    account: EdgeAccount,
    body: PhazeCreateOrderRequest
  ) => Promise<PhazeCreateOrderResponse>
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

    async createOrder(account, body) {
      const order = await api.createOrder(body)
      // Persist order locally for “My Orders”
      await savePhazeOrder(account, order)
      await upsertPhazeOrderIndex(account, order.quoteId)
      return order
    }
  }
}
