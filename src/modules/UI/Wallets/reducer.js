// @flow

import { combineReducers } from 'redux'
import type { AbcDenomination, AbcMetaToken, AbcCurrencyWallet } from 'edge-login'
import _ from 'lodash'

import { GuiWallet } from '../../../types.js'
import * as ACTION from './action'
import * as Constants from '../../../constants/indexConstants.js'
import * as ADD_TOKEN_ACTION from '../scenes/AddToken/action.js'
import { UPDATE_WALLETS } from '../../Core/Wallets/action.js'
import type { Action } from '../../ReduxTypes.js'

export type WalletId = string
export type WalletIds = Array<WalletId>
export type WalletByIdState = { [walletId: WalletId]: GuiWallet }

export const byId = (state: WalletByIdState = {}, action: Action) => {
  if (!action.data) return state

  switch (action.type) {
    case Constants.ACCOUNT_INIT_COMPLETE: {
      const wallets = action.data.currencyWallets
      const out = {}
      for (const walletId of Object.keys(wallets)) {
        const tempWallet = schema(wallets[walletId])
        if (state[walletId]) {
          const enabledTokensOnWallet = state[walletId].enabledTokens
          tempWallet.enabledTokens = enabledTokensOnWallet
          enabledTokensOnWallet.forEach(customToken => {
            tempWallet.nativeBalances[customToken] = wallets[walletId].getBalance({ currencyCode: customToken })
          })
        }
        out[walletId] = tempWallet
      }

      return out
    }
    case UPDATE_WALLETS: {
      const wallets = action.data.currencyWallets
      const out = {}
      for (const walletId of Object.keys(wallets)) {
        const tempWallet = schema(wallets[walletId])
        if (state[walletId]) {
          const enabledTokensOnWallet = state[walletId].enabledTokens
          tempWallet.enabledTokens = enabledTokensOnWallet
          enabledTokensOnWallet.forEach(customToken => {
            tempWallet.nativeBalances[customToken] = wallets[walletId].getBalance({ currencyCode: customToken })
          })
        }
        out[walletId] = tempWallet
      }

      return out
    }

    case ACTION.UPDATE_WALLET_ENABLED_TOKENS: {
      const { walletId, tokens } = action.data
      if (state[walletId] !== undefined) {
        return {
          ...state,
          [walletId]: {
            ...state[walletId],
            enabledTokens: tokens
          }
        }
      } else {
        return state
      }
    }

    case ADD_TOKEN_ACTION.ADD_NEW_CUSTOM_TOKEN_SUCCESS: {
      const { enabledTokens, walletId } = action.data
      if (state[walletId] !== undefined) {
        return {
          ...state,
          [walletId]: {
            ...state[walletId],
            enabledTokens
          }
        }
      } else {
        return state
      }
    }

    case ACTION.ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS: {
      const { coreWalletsToUpdate, oldCurrencyCode, tokenObj } = action.data
      // coreWalletsToUpdate are wallets with non-empty enabledTokens properties
      // receiving token will have to take on sending tokens enabledness
      // sending token will already be disabled because it was deleted
      coreWalletsToUpdate.forEach(wallet => {
        // just disable sending coin from relevant wallet
        const guiWallet = state[wallet.id]
        const enabledTokens = guiWallet.enabledTokens
        let newEnabledTokens = enabledTokens
        // replace old code in enabledTokens with new code for each relevant wallet
        if (newEnabledTokens.indexOf(oldCurrencyCode) >= 0) {
          newEnabledTokens = _.pull(enabledTokens, oldCurrencyCode)
          newEnabledTokens.push(tokenObj.currencyCode)
        }
        const newState = {
          ...state,
          [wallet.id]: {
            ...state[wallet.id],
            enabledTokens: newEnabledTokens
          }
        }
        return newState
      })
      return state
    }

    case ACTION.OVERWRITE_THEN_DELETE_TOKEN_SUCCESS: {
      // adjust enabled tokens
      const { coreWalletsToUpdate, oldCurrencyCode } = action.data
      // coreWalletsToUpdate are wallets with non-empty enabledTokens properties
      // receiving token will have to take on sending tokens enabledness
      // sending token will already be disabled because it was deleted
      coreWalletsToUpdate.forEach(wallet => {
        // just disable sending coin from relevant wallet
        const guiWallet = state[wallet.id]
        const enabledTokens = guiWallet.enabledTokens
        const newEnabledTokens = _.pull(enabledTokens, oldCurrencyCode)
        const newState = {
          ...state,
          [wallet.id]: {
            ...state[wallet.id],
            enabledTokens: newEnabledTokens
          }
        }
        return newState
      })
      return state
    }

    case ACTION.UPSERT_WALLET: {
      const { data } = action
      const guiWallet = schema(data.wallet)
      const enabledTokensOnWallet = state[data.wallet.id].enabledTokens
      guiWallet.enabledTokens = enabledTokensOnWallet
      enabledTokensOnWallet.forEach(customToken => {
        guiWallet.nativeBalances[customToken] = data.wallet.getBalance({ currencyCode: customToken })
      })
      return {
        ...state,
        [data.wallet.id]: guiWallet
      }
    }

    default:
      return state
  }
}

export const walletEnabledTokens = (state: any = {}, action: Action) => {
  if (action.type === Constants.ACCOUNT_INIT_COMPLETE && action.data) {
    return action.data.activeWalletIds
  }
  if (action.type === UPDATE_WALLETS && action.data) {
    return action.data.activeWalletIds
  }

  return state
}

export const activeWalletIds = (state: WalletIds = [], action: Action) => {
  if (!action.data) return state
  if (action.type === Constants.ACCOUNT_INIT_COMPLETE) {
    return action.data.activeWalletIds
  }
  if (action.type === UPDATE_WALLETS) {
    return action.data.activeWalletIds
  }

  return state
}

export const archivedWalletIds = (state: WalletIds = [], action: Action) => {
  if (!action.data) return state
  if (action.type === Constants.ACCOUNT_INIT_COMPLETE) {
    return action.data.archivedWalletIds
  }
  if (action.type === UPDATE_WALLETS) {
    return action.data.archivedWalletIds
  }

  return state
}

export const selectedWalletId = (state: WalletId = '', action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case ACTION.SELECT_WALLET:
      return action.data.walletId
    case Constants.ACCOUNT_INIT_COMPLETE:
      if (action.data.walletId) {
        return action.data.walletId
      }
      return state
    default:
      return state
  }
}

export const selectedCurrencyCode = (state: string = '', action: Action) => {
  if (!action.data) return state
  switch (action.type) {
    case ACTION.SELECT_WALLET:
      return action.data.currencyCode
    case Constants.ACCOUNT_INIT_COMPLETE:
      if (action.data.currencyCode) {
        return action.data.currencyCode
      }
      return state
    default:
      return state
  }
}

const addTokenPending = (state: boolean = false, action: Action) => {
  // if (!action.data) return state
  const type = action.type
  switch (type) {
    case ADD_TOKEN_ACTION.ADD_TOKEN_START:
      return true
    case ADD_TOKEN_ACTION.ADD_TOKEN_SUCCESS:
      return false
    case ADD_TOKEN_ACTION.ADD_NEW_CUSTOM_TOKEN_SUCCESS:
      return false
    case ADD_TOKEN_ACTION.ADD_NEW_CUSTOM_TOKEN_FAILURE:
      return false
    default:
      return state
  }
}

const manageTokensPending = (state: boolean = false, action: Action) => {
  if (!action.data) return state
  const type = action.type
  switch (type) {
    case ACTION.MANAGE_TOKENS_START:
      return true
    case ACTION.MANAGE_TOKENS_SUCCESS:
      return false
    default:
      return state
  }
}

function schema (wallet: AbcCurrencyWallet): GuiWallet {
  const id: string = wallet.id
  const type: string = wallet.type
  const name: string = wallet.name || 'no wallet name'

  const currencyCode: string = wallet.currencyInfo.currencyCode
  const fiatCurrencyCode: string = wallet.fiatCurrencyCode.replace('iso:', '')
  const isoFiatCurrencyCode: string = wallet.fiatCurrencyCode
  const symbolImage: string = wallet.currencyInfo.symbolImage
  const symbolImageDarkMono: string = wallet.currencyInfo.symbolImageDarkMono
  const metaTokens: Array<AbcMetaToken> = wallet.currencyInfo.metaTokens
  const denominations: Array<AbcDenomination> = wallet.currencyInfo.denominations
  const enabledTokens: Array<string> = wallet.enabledTokens || []

  const allDenominations: {
    [currencyCode: string]: { [denomination: string]: AbcDenomination }
  } = {}

  // Add all parent currency denominations to allDenominations
  const parentDenominations = denominations.reduce(
    (denominations, denomination) => ({
      ...denominations,
      [denomination.multiplier]: denomination
    }),
    {}
  )

  allDenominations[currencyCode] = parentDenominations

  const nativeBalances: { [currencyCode: string]: string } = {}
  // Add parent currency balance to balances
  nativeBalances[currencyCode] = wallet.getBalance({ currencyCode })

  // Add parent currency currencyCode
  const currencyNames: { [currencyCode: string]: string } = {}
  currencyNames[currencyCode] = wallet.currencyInfo.currencyName

  metaTokens.forEach(metaToken => {
    const currencyCode: string = metaToken.currencyCode
    const currencyName: string = metaToken.currencyName
    const balance: string = wallet.getBalance({ currencyCode })
    const denominations: Array<AbcDenomination> = metaToken.denominations

    // Add token balance to allBalances
    nativeBalances[currencyCode] = balance
    currencyNames[currencyCode] = currencyName

    // Add all token denominations to allDenominations
    const tokenDenominations: {
      [denomination: string]: AbcDenomination
    } = denominations.reduce((denominations, denomination) => ({ ...denominations, [denomination.multiplier]: denomination }), {})
    allDenominations[currencyCode] = tokenDenominations
  })

  const primaryNativeBalance: string = nativeBalances[currencyCode]

  const newWallet = new GuiWallet(
    id,
    type,
    name,
    primaryNativeBalance,
    nativeBalances,
    currencyNames,
    currencyCode,
    isoFiatCurrencyCode,
    fiatCurrencyCode,
    denominations,
    allDenominations,
    symbolImage,
    symbolImageDarkMono,
    metaTokens,
    enabledTokens
  )

  return newWallet
}

export const wallets = combineReducers({
  byId,
  activeWalletIds,
  archivedWalletIds,
  selectedWalletId,
  selectedCurrencyCode,
  addTokenPending,
  manageTokensPending
})
