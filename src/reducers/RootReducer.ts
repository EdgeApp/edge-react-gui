import { combineReducers, Reducer } from 'redux'

import { PriceChangeNotificationSettings } from '../actions/NotificationActions'
import { actionQueue, ActionQueueState } from '../controllers/action-queue/redux/reducers'
import { loanManager, LoanManagerState } from '../controllers/loan-manager/redux/reducers'
import { ui, UiState } from '../modules/UI/reducer'
import { DeepLink } from '../types/DeepLinkTypes'
import { Action } from '../types/reduxTypes'
import { DeviceReferral } from '../types/ReferralTypes'
import { GuiContact, GuiExchangeRates, WalletListItem } from '../types/types'
import { account, AccountState } from './AccountReducer'
import { core, CoreState } from './CoreReducer'
import { cryptoExchange, CryptoExchangeState } from './CryptoExchangeReducer'
import { network, NetworkState } from './NetworkReducer'
import { permissions, PermissionsState } from './PermissionsReducer'

const defaultDeviceReferral: DeviceReferral = { messages: [], plugins: [] }

export interface RootState {
  readonly contacts: GuiContact[]
  readonly deviceReferral: DeviceReferral
  readonly exchangeRates: GuiExchangeRates

  // Next username to auto-fill at the login screen, or blank if none:
  readonly nextUsername: string | null

  // Deep link waiting to be fulfilled:
  readonly pendingDeepLink: DeepLink | null

  // Hourly and daily price change notification settings
  readonly priceChangeNotifications: PriceChangeNotificationSettings

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

export const rootReducer: Reducer<RootState, Action> = combineReducers({
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
    }
    // @ts-expect-error
    return state
  },

  nextUsername(state: string | null = null, action: Action): string | null {
    switch (action.type) {
      case 'LOGOUT': {
        const { username = null } = action.data
        return username
      }
    }
    return state
  },

  pendingDeepLink(state: DeepLink | null = null, action: Action): DeepLink | null {
    switch (action.type) {
      case 'DEEP_LINK_RECEIVED':
        return action.data
      case 'DEEP_LINK_HANDLED':
        return null
    }
    return state
  },

  // @ts-expect-error
  priceChangeNotifications(state: PriceChangeNotificationSettings = { ignorePriceChanges: false }, action: Action): PriceChangeNotificationSettings {
    switch (action.type) {
      case 'PRICE_CHANGE_NOTIFICATIONS_UPDATE':
        return action.data
    }
    return state
  },

  sortedWalletList(state: WalletListItem[] = [], action: Action): WalletListItem[] {
    return action.type === 'UPDATE_SORTED_WALLET_LIST' ? action.data : state
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
