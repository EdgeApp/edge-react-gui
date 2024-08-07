import { Disklet } from 'disklet'
import { EdgeAccount, EdgeContext, EdgeCurrencyWallet, EdgeDenomination, EdgeSwapPluginType } from 'edge-core-js'

import { ExchangeInfo } from '../actions/ExchangeInfoActions'
import { NotificationSettings } from '../actions/NotificationActions'
import { PasswordReminderTime, SecurityCheckedWallets } from '../actions/SettingsActions'
import { SortOption } from '../components/modals/WalletListSortModal'
import { ActionQueueAction } from '../controllers/action-queue/redux/actions'
import { LoanManagerActions } from '../controllers/loan-manager/redux/actions'
import { CcWalletMap } from '../reducers/FioReducer'
import { PermissionsState } from '../reducers/PermissionsReducer'
import { AccountInitPayload, SettingsState } from '../reducers/scenes/SettingsReducer'
import { TweakSource } from '../util/ReferralHelpers'
import { DeepLink } from './DeepLinkTypes'
import { AccountReferral, DeviceReferral, Promotion, ReferralCache } from './ReferralTypes'
import { FioAddress, FioDomain, GuiContact, GuiExchangeRates, MostRecentWallet, SpendingLimits, WalletListItem } from './types'

// Actions with no payload:
type NoDataActionName =
  | 'DEEP_LINK_HANDLED'
  | 'DEVELOPER_MODE_OFF'
  | 'DEVELOPER_MODE_ON'
  | 'DUMMY_ACTION_PLEASE_IGNORE'
  | 'FIO/SET_FIO_ADDRESSES_PROGRESS'
  | 'LOGOUT'
  | 'OTP_ERROR_SHOWN'
  | 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS'
  | 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD'
  | 'PASSWORD_REMINDER/PASSWORD_REMINDER_POSTPONED'
  | 'PASSWORD_USED'
  | 'SPAM_FILTER_OFF'
  | 'SPAM_FILTER_ON'

export type Action =
  | { type: NoDataActionName }
  // Actions with known payloads:
  | { type: 'ACCOUNT_INIT_COMPLETE'; data: AccountInitPayload }
  | { type: 'ACCOUNT_REFERRAL_LOADED'; data: { referral: AccountReferral; cache: ReferralCache } }
  | { type: 'ACCOUNT_SWAP_IGNORED'; data: boolean }
  | { type: 'ACCOUNT_TWEAKS_REFRESHED'; data: ReferralCache }
  | {
      type: 'CORE/CONTEXT/ADD_CONTEXT'
      data: { context: EdgeContext; disklet: Disklet }
    }
  | {
      type: 'CORE/NEW_TOKENS'
      data: { walletId: string; enablingTokenIds: string[] }
    }
  | {
      type: 'CORE/DISMISS_NEW_TOKENS'
      data: { walletId: string }
    }
  | { type: 'DEEP_LINK_RECEIVED'; data: DeepLink }
  | { type: 'DEVICE_REFERRAL_LOADED'; data: DeviceReferral }
  | { type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES'; data: { exchangeRates: GuiExchangeRates } }
  | { type: 'IS_NOTIFICATION_VIEW_ACTIVE'; data: { isNotificationViewActive: boolean } }
  | { type: 'LOGIN'; data: { account: EdgeAccount; walletSort: SortOption } }
  | { type: 'MESSAGE_TWEAK_HIDDEN'; data: { messageId: string; source: TweakSource } }
  | { type: 'PERMISSIONS/UPDATE'; data: Partial<PermissionsState> }
  | { type: 'NOTIFICATION_SETTINGS_UPDATE'; data: NotificationSettings }
  | { type: 'PROMOTION_ADDED'; data: Promotion }
  | { type: 'PROMOTION_REMOVED'; data: string /* installerId */ }
  | { type: 'CONTACTS/LOAD_CONTACTS_SUCCESS'; data: { contacts: GuiContact[] } }
  | { type: 'SET_TRANSACTION_SUBCATEGORIES'; data: { subcategories: string[] } }
  | { type: 'SPENDING_LIMITS/NEW_SPENDING_LIMITS'; data: { spendingLimits: SpendingLimits } }
  | {
      type: 'UPDATE_FIO_WALLETS'
      data: { fioWallets: EdgeCurrencyWallet[] }
    }
  | { type: 'UI/SETTINGS/CHANGE_TOUCH_ID_SETTINGS'; data: { isTouchEnabled: boolean } }
  | { type: 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY'; data: { isAccountBalanceVisible: boolean } }
  | { type: 'UI/SETTINGS/SET_AUTO_LOGOUT_TIME'; data: { autoLogoutTimeInSeconds: number } }
  | { type: 'UI/SETTINGS/SET_CONTACTS_PERMISSION'; data: { contactsPermissionOn: boolean } }
  | { type: 'UI/SETTINGS/SET_DEFAULT_FIAT'; data: { defaultFiat: string } }
  | { type: 'UI/SETTINGS/SET_DENOMINATION_KEY'; data: { pluginId: string; currencyCode: string; denomination: EdgeDenomination } }
  | { type: 'UI/SETTINGS/SET_MOST_RECENT_WALLETS'; data: { mostRecentWallets: MostRecentWallet[] } }
  | { type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN'; data: string | undefined }
  | { type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN_TYPE'; data: EdgeSwapPluginType | undefined }
  | { type: 'UI/SETTINGS/SET_SECURITY_CHECKED_WALLETS'; data: SecurityCheckedWallets }
  | { type: 'UI/SETTINGS/SET_SETTINGS_LOCK'; data: boolean }
  | { type: 'UI/SETTINGS/SET_USER_PAUSED_WALLETS'; data: { userPausedWallets: string[] } }
  | { type: 'UI/SETTINGS/SET_WALLETS_SORT'; data: { walletsSort: SortOption } }
  | { type: 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED'; data: { pinLoginEnabled: boolean } }
  | { type: 'UI/SETTINGS/UPDATE_SETTINGS'; data: { settings: SettingsState } }
  | {
      type: 'UI/WALLETS/SELECT_WALLET'
      data: { currencyCode: string; walletId: string }
    }
  | {
      type: 'UI/SET_NOTIFICATION_HEIGHT'
      data: { height: number }
    }
  | { type: 'UI/WALLETS/UPSERT_WALLETS'; data: { wallets: EdgeCurrencyWallet[] } }
  | { type: 'UPDATE_EXCHANGE_INFO'; data: ExchangeInfo }
  | { type: 'UPDATE_SORTED_WALLET_LIST'; data: WalletListItem[] }
  | { type: 'UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL'; data: PasswordReminderTime }
  | { type: 'NETWORK/NETWORK_STATUS'; data: { isConnected: boolean } }
  | { type: 'FIO/SET_FIO_ADDRESSES'; data: { fioAddresses: FioAddress[] } }
  | { type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS'; data: { fioAddress: string; ccWalletMap: CcWalletMap } }
  | { type: 'FIO/SET_FIO_DOMAINS'; data: { fioDomains: FioDomain[] } }
  /*
   Self-Contained Package Actions:

   All GUI-wide or global actions should be written inline above, but for any
   self-contained code (or package of code), it may isolate the types within
   the codebase's directory. Although, all of redux is global state, this
   is a way of isolating by convention some state which may only be managed
   by the package.
   */
  | ActionQueueAction
  | LoanManagerActions
