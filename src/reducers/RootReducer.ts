import { combineReducers } from 'redux'

import { NotificationSettings } from '../actions/NotificationActions'
import { actionQueue, ActionQueueState } from '../controllers/action-queue/redux/reducers'
import { loanManager, LoanManagerState } from '../controllers/loan-manager/redux/reducers'
import { DeepLink } from '../types/DeepLinkTypes'
import { Action } from '../types/reduxTypes'
import { DeviceReferral } from '../types/ReferralTypes'
import { GuiContact, GuiExchangeRates, WalletListItem } from '../types/types'
import { account, AccountState } from './AccountReducer'
import { core, CoreState } from './CoreReducer'
import { cryptoExchange, CryptoExchangeState } from './CryptoExchangeReducer'
import { network, NetworkState } from './NetworkReducer'
import { permissions, PermissionsState } from './PermissionsReducer'
import { ui, UiState } from './uiReducer'

const defaultDeviceReferral: DeviceReferral = { messages: [], plugins: [] }

export interface RootState {
  readonly contacts: GuiContact[]
  readonly deviceReferral: DeviceReferral
  readonly exchangeRates: GuiExchangeRates

  // Flag to signal scrolling components to add extra padding at the bottom to
  // avoid blocking content with the notification view
  readonly isNotificationViewActive: boolean

  // Next username to auto-fill at the login screen, or blank if none:
  readonly nextLoginId: string | null

  // Deep link waiting to be fulfilled:
  readonly pendingDeepLink: DeepLink | null

  // Notification settings for price change/marketing/etc
  readonly notificationSettings: NotificationSettings

  // The user's sorted wallet list:
  readonly sortedWalletList: WalletListItem[]

  // Nested reducers:
  readonly account: AccountState
  readonly actionQueue: ActionQueueState
  readonly core: CoreState
  readonly cryptoExchange: CryptoExchangeState
  readonly loanManager: LoanManagerState
  readonly permissions: PermissionsState
  readonly ui: UiState
  readonly network: NetworkState
}

export const rootReducer = combineReducers<RootState, Action>({
  contacts(state: GuiContact[] = [], action: Action): GuiContact[] {
    return action.type === 'CONTACTS/LOAD_CONTACTS_SUCCESS' ? action.data.contacts : state
  },

  deviceReferral(state: DeviceReferral = defaultDeviceReferral, action: Action): DeviceReferral {
    return action.type === 'DEVICE_REFERRAL_LOADED' ? action.data : state
  },

  exchangeRates: (state = {}, action: Action): GuiExchangeRates => {
    switch (action.type) {
      case 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES':
        return action.data.exchangeRates
      case 'LOGOUT':
        return {}
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

  nextLoginId(state: string | null = null, action: Action): string | null {
    switch (action.type) {
      case 'LOGOUT': {
        return action.data.nextLoginId ?? null
      }
      default:
        return state
    }
  },

  pendingDeepLink(state: DeepLink | null = null, action: Action): DeepLink | null {
    switch (action.type) {
      case 'DEEP_LINK_RECEIVED':
        return action.data
      case 'DEEP_LINK_HANDLED':
        return null
      default:
        return state
    }
  },

  notificationSettings(state: NotificationSettings = { ignoreMarketing: false, ignorePriceChanges: false, plugins: {} }, action: Action): NotificationSettings {
    switch (action.type) {
      case 'NOTIFICATION_SETTINGS_UPDATE':
        return action.data
      default:
        return state
    }
  },

  sortedWalletList(state: WalletListItem[] = [], action: Action): WalletListItem[] {
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
  cryptoExchange,
  loanManager,
  permissions,
  ui,
  network
})
