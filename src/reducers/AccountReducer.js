// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../types/reduxTypes.js'
import { type AccountReferral, type Promotion, type ReferralCache } from '../types/ReferralTypes.js'

/**
 * App state tied to the core account object.
 */
export type AccountState = {
  +accountReferral: AccountReferral,
  +accountReferralLoaded: boolean,
  +referralCache: ReferralCache
  // TODO: Move account settings in here
}

const defaultAccountReferral: AccountReferral = {
  promotions: [],
  ignoreAccountSwap: false,
  hiddenAccountMessages: {}
}

const defaultReferralCache: ReferralCache = {
  accountMessages: [],
  accountPlugins: []
}

const accountInner: Reducer<AccountState, Action> = combineReducers({
  accountReferral (state: AccountReferral = defaultAccountReferral, action: Action): AccountReferral {
    switch (action.type) {
      case 'ACCOUNT_REFERRAL_LOADED': {
        const { referral } = action.data
        // Activating a promo link can race with the intial load,
        // so keep any promotions we already have:
        const promotions = mergePromotions(referral.promotions, state.promotions)
        return { ...referral, promotions }
      }
      case 'ACCOUNT_SWAP_IGNORED': {
        return { ...state, ignoreAccountSwap: true }
      }
      case 'MESSAGE_TWEAK_HIDDEN': {
        const { messageId, source } = action.data
        if (source.type === 'promotion') {
          const promotions = state.promotions.map(promo => {
            if (promo.installerId !== source.installerId) return promo
            const hiddenMessages = { ...promo.hiddenMessages, [messageId]: true }
            return { ...promo, hiddenMessages }
          })
          return { ...state, promotions }
        } else {
          const hiddenAccountMessages = { ...state.hiddenAccountMessages, [messageId]: true }
          return { ...state, hiddenAccountMessages }
        }
      }
      case 'PROMOTION_ADDED': {
        const newPromo = action.data
        const promotions = mergePromotions(state.promotions, [newPromo])
        return { ...state, promotions }
      }
      case 'PROMOTION_REMOVED': {
        const installerId = action.data
        const promotions = state.promotions.filter(promo => promo.installerId !== installerId)
        return { ...state, promotions }
      }
    }
    return state
  },

  accountReferralLoaded (state: boolean = false, action: Action): boolean {
    return action.type === 'ACCOUNT_REFERRAL_LOADED' ? true : state
  },

  referralCache (state: ReferralCache = defaultReferralCache, action: Action): ReferralCache {
    switch (action.type) {
      case 'ACCOUNT_REFERRAL_LOADED': {
        const { cache } = action.data
        return cache
      }
      case 'ACCOUNT_TWEAKS_REFRESHED': {
        const cache = action.data
        return cache
      }
    }
    return state
  }
})

// Shared logout logic:
export const account: Reducer<AccountState, Action> = (state: AccountState | void, action: Action) => {
  if (action.type === 'LOGOUT') {
    return accountInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }
  return accountInner(state, action)
}

/**
 * Merges lists of promotions, preferring items from b if there's a conflict.
 */
function mergePromotions (a: Promotion[], b: Promotion[]): Promotion[] {
  const toRemove: { [id: string]: true } = {}
  for (const promo of b) toRemove[promo.installerId] = true
  return [...a.filter(promo => toRemove[promo.installerId] !== true), ...b]
}
