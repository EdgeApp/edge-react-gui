// @flow

import type { DiskletFolder } from 'disklet'
import type { EdgeContext, EdgeCurrencyWallet, EdgeLobby, EdgeParsedUri, EdgeReceiveAddress, EdgeSwapQuote } from 'edge-core-js'

import type { AccountActivationPaymentInfo, HandleActivationInfo, HandleAvailableStatus } from '../reducers/scenes/CreateWalletReducer.js'
import { type CustomTokenInfo, type GuiContact, type GuiCurrencyInfo, type GuiWallet } from '../types.js'

type LegacyActionName =
  | 'ACCOUNT_INIT_COMPLETE'
  | 'ACCOUNT/LOGGED_IN'
  | 'ADDRESS_DEEP_LINK_RECEIVED'
  | 'CORE/WALLETS/UPDATE_WALLETS'
  | 'DEEP_LINK_RECEIVED'
  | 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES'
  | 'NEW_RECEIVE_ADDRESS'
  | 'PERMISSIONS/UPDATE'
  | 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL'
  | 'SET_CONFIRM_PASSWORD_ERROR'
  | 'SET_TRANSACTION_SUBCATEGORIES'
  | 'SPENDING_LIMITS/NEW_SPENDING_LIMITS'
  | 'UI/COMPONENTS/DROPDOWN_ALERT/DISMISS_DROPDOWN_ALERT'
  | 'UI/COMPONENTS/DROPDOWN_ALERT/DISPLAY_DROPDOWN_ALERT'
  | 'UI/COMPONENTS/ERROR_ALERT/DISMISS_ERROR_ALERT'
  | 'UI/COMPONENTS/ERROR_ALERT/DISPLAY_ERROR_ALERT'
  | 'UI/COMPONENTS/TRANSACTION_ALERT/DISMISS_TRANSACTION_ALERT'
  | 'UI/COMPONENTS/TRANSACTION_ALERT/DISPLAY_TRANSACTION_ALERT'
  | 'UI/SCENES/TRANSACTION_LIST/TRANSACTIONS_SEARCH_HIDDEN'
  | 'UI/SCENES/TRANSACTION_LIST/TRANSACTIONS_SEARCH_VISIBLE'
  | 'UI/SCENES/TRANSACTION_LIST/UPDATE_TRANSACTIONS'
  | 'UI/SEND_CONFIMATION/MAKE_SPEND_FAILED'
  | 'UI/SEND_CONFIMATION/NEW_PIN'
  | 'UI/SEND_CONFIMATION/NEW_SPEND_INFO'
  | 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING'
  | 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION'
  | 'UI/SETTINGS/CHANGE_TOUCH_ID_SETTINGS'
  | 'UI/SETTINGS/LOAD_SETTINGS'
  | 'UI/SETTINGS/OTP_SETTINGS'
  | 'UI/SETTINGS/SET_ACCOUNT_BALANCE_VISIBILITY'
  | 'UI/SETTINGS/SET_AUTO_LOGOUT_TIME'
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
  | 'UI/WALLETS/SELECT_WALLET'
  | 'UI/WALLETS/UPSERT_WALLETS'
  | 'UNIQUE_IDENTIFIER_MODAL/UNIQUE_IDENTIFIER_CHANGED'
  | 'UPDATE_CURRENT_SCENE_KEY'
  | 'UPDATE_EXCHANGE_RATES'
  | 'UPDATE_RECEIVE_ADDRESS_SUCCESS'
  | 'UPDATE_SHOW_PASSWORD_RECOVERY_REMINDER_MODAL'
  | 'UPDATE_WALLET_FIAT_BALANCE_VISIBILITY'
  | 'UPDATE_WALLET_LOADING_PROGRESS'
  | 'UPDATE_WALLET_TRANSFER_LIST'

// Actions with no payload:
type NoDataActionName =
  | 'ADD_TOKEN_START'
  | 'ADDRESS_DEEP_LINK_COMPLETE'
  | 'CLOSE_ALL_WALLET_LIST_MODALS'
  | 'CLOSE_HELP_MODAL'
  | 'CLOSE_SELECT_USER'
  | 'CLOSE_VIEWXPUB_WALLET_MODAL'
  | 'DELETE_CUSTOM_TOKEN_FAILURE'
  | 'DELETE_CUSTOM_TOKEN_START'
  | 'DEVELOPER_MODE_OFF'
  | 'DEVELOPER_MODE_ON'
  | 'DISABLE_OTP_RESET'
  | 'DISABLE_SCAN'
  | 'DISABLE_WALLET_LIST_MODAL_VISIBILITY'
  | 'DONE_SHIFT_TRANSACTION'
  | 'DUMMY_ACTION_PLEASE_IGNORE'
  | 'EDGE_LOBBY_ACCEPT_FAILED'
  | 'EDIT_CUSTOM_TOKEN_FAILURE'
  | 'EDIT_CUSTOM_TOKEN_START'
  | 'ENABLE_SCAN'
  | 'HIDE_DELETE_TOKEN_MODAL'
  | 'HIDE_PASSWORD_RECOVERY_MODAL'
  | 'INVALIDATE_EDGE_LOBBY'
  | 'LOGGED_OUT'
  | 'LOGS/SEND_LOGS_PENDING'
  | 'MANAGE_TOKENS_START'
  | 'MANAGE_TOKENS_SUCCESS'
  | 'NEED_FINISH_KYC_OFF'
  | 'NEED_KYC_SETTING'
  | 'NEED_KYC'
  | 'NEED_KYC'
  | 'ON_KYC_TOKEN_SET'
  | 'OPEN_HELP_MODAL'
  | 'OPEN_SELECT_USER'
  | 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_FAIL'
  | 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_START'
  | 'PASSWORD_REMINDER_MODAL/CHECK_PASSWORD_SUCCESS'
  | 'PASSWORD_REMINDER_MODAL/PASSWORD_REMINDER_POSTPONED'
  | 'PASSWORD_REMINDER_MODAL/REQUEST_CHANGE_PASSWORD'
  | 'PASSWORD_REMINDER/PASSWORD_REMINDER_POSTPONED'
  | 'PASSWORD_USED'
  | 'PLAY_SEND_SOUND'
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
  | 'WIPE_KYC_NEED'
  | 'ADD_NEW_CUSTOM_TOKEN_FAILURE'

export type Action =
  | { type: LegacyActionName, data: any }
  | { type: NoDataActionName }
  // Actions with known payloads:
  | { type: 'ACCOUNT_ACTIVATION_INFO', data: HandleActivationInfo }
  | { type: 'ACCOUNT_ACTIVATION_PAYMENT_INFO', data: AccountActivationPaymentInfo }
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
      data: { context: EdgeContext, folder: DiskletFolder }
    }
  | {
      type: 'CORE/CONTEXT/ADD_USERNAMES',
      data: { usernames: Array<string> }
    }
  | {
      type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT',
      data: { username: string }
    }
  | { type: 'DELETE_CUSTOM_TOKEN_SUCCESS', data: { currencyCode: string } }
  | {
      type: 'INSERT_WALLET_IDS_FOR_PROGRESS',
      data: { activeWalletIds: Array<string> }
    }
  | { type: 'IS_CHECKING_HANDLE_AVAILABILITY', data: boolean }
  | { type: 'LOGOUT', data: { username?: string } }
  | { type: 'LOGS/SEND_LOGS_REQUEST', text: string }
  | { type: 'LOGS/SEND_LOGS_SUCCESS', result: string }
  | { type: 'LOGS/SEND_LOGS_FAILURE', error: Error }
  | {
      type: 'OPEN_VIEWXPUB_WALLET_MODAL',
      data: { walletId: string, xPub: string | null }
    }
  | {
      type: 'OVERWRITE_THEN_DELETE_TOKEN_SUCCESS',
      data: {
        tokenObj: CustomTokenInfo,
        oldCurrencyCode: string,
        coreWalletsToUpdate: Array<EdgeCurrencyWallet>
      }
    }
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
  | { type: 'NEED_FINISH_KYC', data: { pluginName: string } }
  | { type: 'GENERIC_SHAPE_SHIFT_ERROR', data: string }
  | { type: 'OPEN_WALLET_SELECTOR_MODAL', data: 'from' | 'to' }
  | { type: 'PARSE_URI_SUCCEEDED', data: { parsedUri: EdgeParsedUri } }
  | { type: 'SAVE_EDGE_LOBBY', data: EdgeLobby }
  | { type: 'SET_LOBBY_ERROR', data: string }
  | { type: 'SET_FROM_WALLET_MAX', data: string }
  | {
      type: 'UI/WALLETS/REFRESH_RECEIVE_ADDRESS',
      data: {
        walletId: string,
        receiveAddress: EdgeReceiveAddress
      }
    }
  | {
      type: 'UPDATE_EXISTING_TOKEN_SUCCESS',
      data: { tokenObj: CustomTokenInfo }
    }
  | {
      type: 'UPDATE_SHIFT_TRANSACTION_FEE',
      data: {
        quote: EdgeSwapQuote,
        toNativeAmount: string,
        toDisplayAmount: string,
        fromNativeAmount: string,
        fromDisplayAmount: string,
        quoteExpireDate: Date | null,
        fee: string
      }
    }
  | {
      type: 'UPDATE_WALLET_ENABLED_TOKENS',
      data: { walletId: string, tokens: Array<string> }
    }
  | { type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR', data: string }
