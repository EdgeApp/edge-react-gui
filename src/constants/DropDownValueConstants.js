// @flow

import THEME from '../theme/variables/airbitz'
import s from '../locales/strings.js'

export const WALLET_OPTIONS = {
  SORT: {
    value: 'sort',
    label: s.strings.fragment_wallets_sort,
    modalVisible: false
  },
  RENAME: {
    value: 'rename',
    label: s.strings.string_rename,
    modalVisible: true
  },
  DELETE: {
    value: 'delete',
    label: s.strings.string_delete,
    modalVisible: true
  },
  RESYNC: {
    value: 'resync',
    label: s.strings.string_resync,
    modalVisible: true
  },
  GET_SEED: {
    value: 'getSeed',
    label: s.strings.string_get_seed,
    modalVisible: true
  },
  SPLIT: {
    value: 'split',
    currencyCode: 'BTC',
    label: s.strings.string_split,
    modalVisible: true
  },
  MANAGE_TOKENS: {
    value: 'manageTokens',
    currencyCode: 'ETH',
    label: s.strings.fragmet_wallets_managetokens_option,
    modalVisible: false
  }
}

export const CHANGE_MINING_FEE_VALUE = 'changeMiningFee'
export const EXCHANGE_MAX_AMOUNT_VALUE = 'exchangeMaxAmountValue'
export const HELP_VALUE = 'helpValue'
export const SORT_VALUE = 'sort'
export const RENAME_VALUE = 'rename'
export const ADD_TOKENS_VALUE = 'addTokensValue'
export const DELETE_VALUE = 'delete'
export const GET_SEED_VALUE = 'getSeed'
export const RESYNC_VALUE = 'resync'
export const ADD_TOKEN_VALUE = 'addToken'
export const ARCHIVE_VALUE = 'archive'
export const ACTIVATE_VALUE = 'activate'
export const RESTORE_VALUE = 'restore'
export const SPLIT_VALUE = 'split'
export const MANAGE_TOKENS_VALUE = 'manageTokens'
export const REQUEST_WALLET_DIALOG_TOP = THEME.HEADER
export const TRANSACTIONLIST_WALLET_DIALOG_TOP = THEME.HEADER
export const SCAN_WALLET_DIALOG_TOP = THEME.HEADER
export const CRYPTO_EXCHANGE_WALLET_DIALOG_TOP = THEME.HEADER
