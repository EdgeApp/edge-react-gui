import { combineReducers } from 'redux'

import { NotificationSettings } from '../actions/NotificationActions'
import { actionQueue, ActionQueueState } from '../controllers/action-queue/redux/reducers'
import { loanManager, LoanManagerState } from '../controllers/loan-manager/redux/reducers'
import { Action } from '../types/reduxTypes'
import { DeviceReferral } from '../types/ReferralTypes'
import { GuiContact, GuiExchangeRates, WalletListItem } from '../types/types'
import { account, AccountState } from './AccountReducer'
import { core, CoreState } from './CoreReducer'
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

  // Notification settings for price change/marketing/etc
  readonly notificationSettings: NotificationSettings

  // The user's sorted wallet list:
  readonly sortedWalletList: WalletListItem[]

  // Nested reducers:
  readonly account: AccountState
  readonly actionQueue: ActionQueueState
  readonly core: CoreState
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
  loanManager,
  permissions,
  ui,
  network
})
