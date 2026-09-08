import { combineReducers } from 'redux'

import type { GuiExchangeRates } from '../actions/ExchangeRateActions'
import type { NotificationSettings } from '../actions/NotificationActions'
import {
  actionQueue,
  type ActionQueueState
} from '../controllers/action-queue/redux/reducers'
import {
  loanManager,
  type LoanManagerState
} from '../controllers/loan-manager/redux/reducers'
import type { Action } from '../types/reduxTypes'
import type { DeviceReferral } from '../types/ReferralTypes'
import type { GuiContact, WalletListItem } from '../types/types'
import { account, type AccountState } from './AccountReducer'
import { core, type CoreState } from './CoreReducer'
import { network, type NetworkState } from './NetworkReducer'
import { permissions, type PermissionsState } from './PermissionsReducer'
import { staking, type StakingState } from './StakingReducer'
import { ui, type UiState } from './uiReducer'

const defaultDeviceReferral: DeviceReferral = { messages: [], plugins: [] }

export interface RootState {
  readonly contacts: GuiContact[]
  readonly deviceReferral: DeviceReferral
  readonly exchangeRates: GuiExchangeRates

  // Flag to signal scrolling components to add extra padding at the bottom to
  // avoid blocking content with the notification view
  readonly isNotificationViewActive: boolean

  // Promo id carried by the deep link or promo card that opened the current
  // buy / sell / swap flow. It attributes the next conversion and is cleared
  // once that conversion is logged, so it never leaks into a later one. This
  // is deliberately NOT part of `accountReferral`: the id is scoped to one
  // entry into the flow and is never persisted to the account.
  readonly linkPromoId: string | null

  // Notification settings for price change/marketing/etc
  readonly notificationSettings: NotificationSettings

  // The user's sorted wallet list:
  readonly sortedWalletList: WalletListItem[]

  // Nested reducers:
  readonly account: AccountState
  readonly actionQueue: ActionQueueState
  readonly core: CoreState
  readonly loanManager: LoanManagerState
  readonly staking: StakingState
  readonly permissions: PermissionsState
  readonly ui: UiState
  readonly network: NetworkState
}

export const rootReducer = combineReducers<RootState, Action>({
  contacts(state: GuiContact[] = [], action: Action): GuiContact[] {
    return action.type === 'CONTACTS/LOAD_CONTACTS_SUCCESS'
      ? action.data.contacts
      : state
  },

  deviceReferral(
    state: DeviceReferral = defaultDeviceReferral,
    action: Action
  ): DeviceReferral {
    return action.type === 'DEVICE_REFERRAL_LOADED' ? action.data : state
  },

  exchangeRates: (
    state: GuiExchangeRates = { crypto: {}, fiat: {} },
    action: Action
  ): GuiExchangeRates => {
    switch (action.type) {
      case 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES':
        return action.data.exchangeRates
      case 'LOGOUT':
        return { crypto: {}, fiat: {} }
      default:
        return state
    }
  },

  isNotificationViewActive: (state = false, action: Action): boolean => {
    switch (action.type) {
      case 'IS_NOTIFICATION_VIEW_ACTIVE':
        return action.data.isNotificationViewActive
      default:
        return state
    }
  },

  linkPromoId: (state: string | null = null, action: Action): string | null => {
    switch (action.type) {
      case 'LINK_PROMO_ID/SET':
        return action.data.promoId ?? null
      case 'LOGOUT':
        return null
      default:
        return state
    }
  },

  notificationSettings(
    state: NotificationSettings = {
      ignoreMarketing: false,
      ignorePriceChanges: false,
      plugins: {}
    },
    action: Action
  ): NotificationSettings {
    switch (action.type) {
      case 'NOTIFICATION_SETTINGS_UPDATE':
        return action.data
      default:
        return state
    }
  },

  sortedWalletList(
    state: WalletListItem[] = [],
    action: Action
  ): WalletListItem[] {
    switch (action.type) {
      case 'UPDATE_SORTED_WALLET_LIST':
        return action.data
      case 'LOGOUT':
        return []
      default:
        return state
    }
  },

  // Nested reducers:
  account,
  actionQueue,
  core,
  loanManager,
  permissions,
  staking,
  ui,
  network
})
