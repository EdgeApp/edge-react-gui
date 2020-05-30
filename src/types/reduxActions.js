// @flow

import { type Disklet } from 'disklet'
import { type EdgeAccount, type EdgeContext, type EdgeCurrencyWallet, type EdgeLobby, type EdgeParsedUri, type EdgeReceiveAddress } from 'edge-core-js'

import type { CcWalletMap } from '../reducers/FioReducer'
import { type PermissionsState } from '../reducers/PermissionsReducer.js'
import type { AccountActivationPaymentInfo, HandleActivationInfo, HandleAvailableStatus } from '../reducers/scenes/CreateWalletReducer.js'
import { type TweakSource } from '../util/ReferralHelpers.js'
import { type DeepLink } from './DeepLink.js'
import { type AccountReferral, type DeviceReferral, type Promotion, type ReferralCache } from './ReferralTypes.js'
import {
  type CustomTokenInfo,
  type FioAddress,
  type FioDomain,
  type FioObtRecord,
  type GuiContact,
  type GuiCurrencyInfo,
  type GuiSwapInfo,
  type GuiWallet
} from './types.js'

type LegacyActionName =
  | 'ACCOUNT_INIT_COMPLETE'
  | 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES'
  | 'NEW_RECEIVE_ADDRESS'
  | 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL'
  | 'SET_CONFIRM_PASSWORD_ERROR'
  | 'SET_TRANSACTION_SUBCATEGORIES'
  | 'SPENDING_LIMITS/NEW_SPENDING_LIMITS'
  | 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS'
  | 'UI/SEND_CONFIMATION/NEW_PIN'
  | 'UI/SEND_CONFIMATION/NEW_SPEND_INFO'
  | 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING'
  | 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION'
  | 'UI/SEND_CONFIMATION/TOGGLE_CRYPTO_ON_TOP'
  | 'UI/SETTINGS/CHANGE_TOUCH_ID_SETTINGS'
  | 'UI/SETTINGS/LOAD_SETTINGS'
  | 'UI/SETTINGS/OTP_SETTINGS'
  | 'UI/SETTINGS/SET_MOST_RECENT_WALLETS'
  | 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY'
  | 'UI/SETTINGS/SET_BLUETOOTH_MODE'
  | 'UI/SETTINGS/SET_DEFAULT_FIAT'
  | 'UI/SETTINGS/SET_DENOMINATION_KEY'
  | 'UI/SETTINGS/SET_MERCHANT_MODE'
  | 'UI/SETTINGS/SET_OTP_MODE'
  | 'UI/SETTINGS/SET_PIN_MODE'
  | 'UI/SETTINGS/SET_SETTINGS_LOCK'
  | 'UI/SETTINGS/TOGGLE_PIN_LOGIN_ENABLED'
  | 'UI/SETTINGS/TOUCH_ID_SETTINGS'
  | 'UI/SETTINGS/UPDATE_SETTINGS'
  | 'UI/WALLETS/UPSERT_WALLETS'
  | 'UNIQUE_IDENTIFIER_MODAL/UNIQUE_IDENTIFIER_CHANGED'
  | 'UPDATE_EXCHANGE_RATES'
  | 'UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL'
  | 'UPDATE_WALLET_FIAT_BALANCE_VISIBILITY'
  | 'UPDATE_WALLET_LOADING_PROGRESS'

// Actions with no payload:
type NoDataActionName =
  | 'ADD_NEW_CUSTOM_TOKEN_FAILURE'
  | 'ADD_TOKEN_START'
  | 'CLOSE_SELECT_USER'
  | 'CLOSE_VIEWXPUB_WALLET_MODAL'
  | 'DEEP_LINK_HANDLED'
  | 'DELETE_CUSTOM_TOKEN_FAILURE'
  | 'DELETE_CUSTOM_TOKEN_START'
  | 'DEVELOPER_MODE_OFF'
  | 'DEVELOPER_MODE_ON'
  | 'DISABLE_OTP_RESET'
  | 'DISABLE_SCAN'
  | 'DONE_SHIFT_TRANSACTION'
  | 'DUMMY_ACTION_PLEASE_IGNORE'
  | 'EDGE_LOBBY_ACCEPT_FAILED'
  | 'EDIT_CUSTOM_TOKEN_FAILURE'
  | 'EDIT_CUSTOM_TOKEN_START'
  | 'ENABLE_SCAN'
  | 'HIDE_DELETE_TOKEN_MODAL'
  | 'HIDE_PASSWORD_RECOVERY_MODAL'
  | 'INVALIDATE_EDGE_LOBBY'
  | 'LOGS/SEND_LOGS_PENDING'
  | 'MANAGE_TOKENS_START'
  | 'MANAGE_TOKENS_SUCCESS'
  | 'OPEN_SELECT_USER'
  | 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_FAIL'
  | 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_START'
  | 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS'
  | 'PASSWORD_REMINDER_MODAL/PASSWORD_REMINDER_POSTPONED'
  | 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD'
  | 'PASSWORD_REMINDER/PASSWORD_REMINDER_POSTPONED'
  | 'PASSWORD_USED'
  | 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/ACTIVATED'
  | 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/DEACTIVATED'
  | 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_START'
  | 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_SUCCESS'
  | 'PROCESS_EDGE_LOGIN'
  | 'RECEIVED_INSUFFICENT_FUNDS_ERROR'
  | 'SHIFT_COMPLETE'
  | 'SHOW_DELETE_TOKEN_MODAL'
  | 'SHOW_PASSWORD_RECOVERY_MODAL'
  | 'START_CALC_MAX'
  | 'START_SHIFT_TRANSACTION'
  | 'TOGGLE_ENABLE_TORCH'
  | 'TOGGLE_SCAN_TO_WALLET_LIST_MODAL'
  | 'TOGGLE_WALLET_LIST_MODAL_VISIBILITY'
  | 'UI/SEND_CONFIMATION/RESET'
  | 'UI/WALLETS/CREATE_WALLET_FAILURE'
  | 'UI/WALLETS/CREATE_WALLET_START'
  | 'UI/WALLETS/CREATE_WALLET_SUCCESS'
  | 'UNIQUE_IDENTIFIER_MODAL/ACTIVATED'
  | 'UNIQUE_IDENTIFIER_MODAL/DEACTIVATED'
  | 'UNIQUE_IDENTIFIER_MODAL/RESET'
  | 'USE_LEGACY_REQUEST_ADDRESS'
  | 'USE_REGULAR_REQUEST_ADDRESS'
  | 'FIO/SET_FIO_ADDRESSES_PROGRESS'

export type Action =
  | { type: LegacyActionName, data: any }
  | { type: NoDataActionName }
  // Actions with known payloads:
  | { type: 'ACCOUNT_ACTIVATION_INFO', data: HandleActivationInfo }
  | { type: 'ACCOUNT_ACTIVATION_PAYMENT_INFO', data: AccountActivationPaymentInfo }
  | { type: 'ACCOUNT_REFERRAL_LOADED', data: { referral: AccountReferral, cache: ReferralCache } }
  | { type: 'ACCOUNT_SWAP_IGNORED', data: boolean }
  | { type: 'ACCOUNT_TWEAKS_REFRESHED', data: ReferralCache }
  | {
      type: 'ADD_NEW_CUSTOM_TOKEN_SUCCESS',
      data: {
        walletId: string,
        tokenObj: CustomTokenInfo,
        settings: Object,
        enabledTokens: Array<string>
      }
    }
  | {
      type: 'ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS',
      data: {
        walletId: string,
        code: string,
        coreWalletsToUpdate: Array<EdgeCurrencyWallet>,
        enabledTokensOnWallet: Array<string>,
        oldCurrencyCode: string,
        setSettings: Object,
        tokenObj: CustomTokenInfo
      }
    }
  | {
      type: 'CORE/CONTEXT/ADD_CONTEXT',
      data: { context: EdgeContext, disklet: Disklet }
    }
  | {
      type: 'CORE/WALLETS/UPDATE_WALLETS',
      data: {
        activeWalletIds: Array<string>,
        archivedWalletIds: Array<string>,
        currencyWallets: { [id: string]: EdgeCurrencyWallet },
        receiveAddresses: { [id: string]: EdgeReceiveAddress }
      }
    }
  | { type: 'DEEP_LINK_RECEIVED', data: DeepLink }
  | { type: 'DELETE_CUSTOM_TOKEN_SUCCESS', data: { currencyCode: string } }
  | { type: 'DEVICE_REFERRAL_LOADED', data: DeviceReferral }
  | {
      type: 'INSERT_WALLET_IDS_FOR_PROGRESS',
      data: { activeWalletIds: Array<string> }
    }
  | { type: 'IS_CHECKING_HANDLE_AVAILABILITY', data: boolean }
  | { type: 'LOGIN', data: EdgeAccount }
  | { type: 'LOGOUT', data: { username?: string } }
  | { type: 'LOGS/SEND_LOGS_REQUEST', text: string }
  | { type: 'LOGS/SEND_LOGS_SUCCESS', result: string }
  | { type: 'LOGS/SEND_LOGS_FAILURE', error: Error }
  | { type: 'MESSAGE_TWEAK_HIDDEN', data: { messageId: string, source: TweakSource } }
  | {
      type: 'OPEN_VIEWXPUB_WALLET_MODAL',
      data: { walletId: string, xPub: string | null, xPubExplorer: string }
    }
  | {
      type: 'OVERWRITE_THEN_DELETE_TOKEN_SUCCESS',
      data: {
        tokenObj: CustomTokenInfo,
        oldCurrencyCode: string,
        coreWalletsToUpdate: Array<EdgeCurrencyWallet>
      }
    }
  | { type: 'PERMISSIONS/UPDATE', data: PermissionsState }
  | { type: 'PROMOTION_ADDED', data: Promotion }
  | { type: 'PROMOTION_REMOVED', data: string /* installerId */ }
  | { type: 'HANDLE_AVAILABLE_STATUS', data: HandleAvailableStatus }
  | {
      type: 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE' | 'SELECT_TO_WALLET_CRYPTO_EXCHANGE',
      data: {
        balanceMessage: string,
        currencyCode: string,
        primaryInfo: GuiCurrencyInfo,
        wallet: GuiWallet
      }
    }
  | { type: 'CONTACTS/LOAD_CONTACTS_SUCCESS', data: { contacts: Array<GuiContact> } }
  | { type: 'GENERIC_SHAPE_SHIFT_ERROR', data: string }
  | { type: 'OPEN_WALLET_SELECTOR_MODAL', data: 'from' | 'to' }
  | { type: 'PARSE_URI_SUCCEEDED', data: { parsedUri: EdgeParsedUri } }
  | { type: 'SAVE_EDGE_LOBBY', data: EdgeLobby }
  | { type: 'SET_LOBBY_ERROR', data: string }
  | { type: 'SET_FROM_WALLET_MAX', data: string }
  | { type: 'UI/SETTINGS/SET_AUTO_LOGOUT_TIME', data: { autoLogoutTimeInSeconds: number } }
  | { type: 'UI/SETTINGS/SET_PREFERRED_SWAP_PLUGIN', data: string | void }
  | {
      type: 'UI/WALLETS/REFRESH_RECEIVE_ADDRESS',
      data: {
        walletId: string,
        receiveAddress: EdgeReceiveAddress
      }
    }
  | {
      type: 'UI/WALLETS/SELECT_WALLET',
      data: { currencyCode: string, walletId: string }
    }
  | {
      type: 'UPDATE_EXISTING_TOKEN_SUCCESS',
      data: { tokenObj: CustomTokenInfo }
    }
  | { type: 'UPDATE_SWAP_QUOTE', data: GuiSwapInfo }
  | {
      type: 'UPDATE_WALLET_ENABLED_TOKENS',
      data: { walletId: string, tokens: Array<string> }
    }
  | { type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR', data: string }
  | { type: 'NETWORK/NETWORK_STATUS', data: { isConnected: boolean } }
  | { type: 'FIO/SET_FIO_ADDRESSES', data: { fioAddresses: FioAddress[] } }
  | { type: 'FIO/UPDATE_CONNECTED_WALLETS', data: { connectedWalletsByFioAddress: { [fioAddress: string]: CcWalletMap } } }
  | { type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS', data: { fioAddress: string, ccWalletMap: CcWalletMap } }
  | { type: 'FIO/SET_OBT_DATA', data: FioObtRecord[] }
  | { type: 'FIO/SET_FIO_DOMAINS', data: { fioDomains: FioDomain[] } }
