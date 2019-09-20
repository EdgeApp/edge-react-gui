// @flow

import s from '../locales/strings.js'
import THEME from '../theme/variables/airbitz'

export const CHANGE_MINING_FEE_VALUE = 'changeMiningFee'
export const EXCHANGE_MAX_AMOUNT_VALUE = 'exchangeMaxAmountValue'
export const HELP_VALUE = 'helpValue'
export const SORT_VALUE = 'sort'
export const RENAME_VALUE = 'rename'
export const ADD_TOKENS_VALUE = 'addTokensValue'
export const DELETE_VALUE = 'delete'
export const GET_SEED_VALUE = 'getSeed'
export const VIEW_XPUB_VALUE = 'viewXPub'
export const RESYNC_VALUE = 'resync'
export const ARCHIVE_VALUE = 'archive'
export const ACTIVATE_VALUE = 'activate'
export const RESTORE_VALUE = 'restore'
export const SPLIT_VALUE = 'split'
export const EXPORT_WALLET_TRANSACTIONS_VALUE = 'exportWalletTransactions'
export const MANAGE_TOKENS_VALUE = 'manageTokens'
export const TRANSACTIONLIST_WALLET_DIALOG_TOP = THEME.HEADER

export const WALLET_OPTIONS = {
  SORT: {
    value: SORT_VALUE,
    label: s.strings.fragment_wallets_sort,
    modalVisible: false
  },
  RENAME: {
    value: RENAME_VALUE,
    label: s.strings.string_rename,
    modalVisible: true
  },
  DELETE: {
    value: DELETE_VALUE,
    label: s.strings.string_delete,
    modalVisible: true
  },
  RESYNC: {
    value: RESYNC_VALUE,
    label: s.strings.string_resync,
    modalVisible: true
  },
  EXPORT: {
    value: EXPORT_WALLET_TRANSACTIONS_VALUE,
    label: s.strings.fragment_wallets_export_transactions,
    modalVisible: false
  },
  GET_SEED: {
    value: GET_SEED_VALUE,
    label: s.strings.string_master_private_key,
    modalVisible: true
  },
  SPLIT: {
    value: SPLIT_VALUE,
    currencyCode: ['BTC', 'BCH'],
    label: s.strings.string_split_wallet,
    modalVisible: true
  },
  MANAGE_TOKENS: {
    value: MANAGE_TOKENS_VALUE,
    currencyCode: ['ETH', 'RBTC'],
    label: s.strings.string_add_edit_tokens,
    modalVisible: false
  },
  VIEW_XPUB: {
    value: VIEW_XPUB_VALUE,
    currencyCode: ['BTC', 'BCH', 'DASH', 'FTC', 'XZC', 'LTC', 'UFO', 'QTUM', 'VTC', 'BTG', 'DGB', 'SMART', 'GRS', 'BSV', 'EBST', 'EOS', 'DOGE', 'RVN', 'RBTC'],
    label: s.strings.fragment_wallets_view_xpub,
    modalVisible: true
  }
}
