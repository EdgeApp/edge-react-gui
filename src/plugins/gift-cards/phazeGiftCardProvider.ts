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
  type PhazeTokensResponse
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
  registerUser: (
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
    registerUser: async body => {
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
