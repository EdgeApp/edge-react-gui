// @flow

import type { EdgeCurrencyWallet, EdgeDenomination, EdgeMetaToken, EdgeReceiveAddress } from 'edge-core-js'
import _ from 'lodash'
import { combineReducers } from 'redux'

import * as Constants from '../../../constants/indexConstants.js'
import type { GuiWallet } from '../../../types.js'
import { UPDATE_WALLETS } from '../../Core/Wallets/action.js'
import type { Action } from '../../ReduxTypes.js'
import * as ADD_TOKEN_ACTION from '../scenes/AddToken/action.js'
import * as ACTION from './action'

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
        const tempWallet = schema(wallets[walletId], action.data.receiveAddresses[walletId])
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
        const tempWallet = schema(wallets[walletId], action.data.receiveAddresses[walletId])
        if (state[walletId]) {
          const enabledTokensOnWallet = state[walletId].enabledTokens
          tempWallet.enabledTokens = enabledTokensOnWallet
          enabledTokensOnWallet.forEach(customToken => {
            tempWallet.nativeBalances[customToken] = wallets[walletId].getBalance({ currencyCode: customToken })
          })
        }
        out[walletId] = {
          ...state[walletId],
          ...tempWallet
        }
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

    case ACTION.UPSERT_WALLETS: {
      const { data } = action
      const wallets = data.wallets
      const out = { ...state }
      for (const wallet of wallets) {
        if (!state || !state[wallet.id]) {
          continue
        }
        const guiWallet = schema(wallet, state[wallet.id].receiveAddress)
        const enabledTokensOnWallet = state[wallet.id].enabledTokens
        guiWallet.enabledTokens = enabledTokensOnWallet
        enabledTokensOnWallet.forEach(customToken => {
          guiWallet.nativeBalances[customToken] = wallet.getBalance({ currencyCode: customToken })
        })
        out[wallet.id] = {
          ...state[wallet.id],
          ...guiWallet
        }
      }
      return out
    }

    case ACTION.REFRESH_RECEIVE_ADDRESS: {
      const {
        data: { walletId, receiveAddress }
      } = action
      return {
        ...state,
        [walletId]: {
          ...state[walletId],
          receiveAddress
        }
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

export const walletLoadingProgress = (state: { [string]: Number } = {}, action: Action) => {
  if (!action.data) return state
  const { type, data } = action
  switch (type) {
    case ACTION.INSERT_WALLET_IDS_FOR_PROGRESS:
      const activeWalletIdList = data.activeWalletIds
      const activeWalletIdProgress = {}
      activeWalletIdList.map(item => {
        activeWalletIdProgress[item] = 0
      })
      return activeWalletIdProgress
    case ACTION.UPDATE_WALLET_LOADING_PROGRESS:
      // prevent backwards progress
      if (data.addressLoadingProgress < state[data.walletId]) return state
      return {
        ...state,
        [data.walletId]: data.addressLoadingProgress
      }
    default:
      return state
  }
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

export const addTokenPending = (state: boolean = false, action: Action) => {
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

export const manageTokensPending = (state: boolean = false, action: Action) => {
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

function schema (wallet: EdgeCurrencyWallet, receiveAddress: EdgeReceiveAddress): GuiWallet {
  const id: string = wallet.id
  const type: string = wallet.type
  const name: string = wallet.name || 'no wallet name'

  const currencyCode: string = wallet.currencyInfo.currencyCode
  const fiatCurrencyCode: string = wallet.fiatCurrencyCode.replace('iso:', '')
  const isoFiatCurrencyCode: string = wallet.fiatCurrencyCode
  const symbolImage = wallet.currencyInfo.symbolImage
  const symbolImageDarkMono = wallet.currencyInfo.symbolImageDarkMono
  const metaTokens: Array<EdgeMetaToken> = wallet.currencyInfo.metaTokens
  const denominations: Array<EdgeDenomination> = wallet.currencyInfo.denominations
  const blockHeight: number = wallet.getBlockHeight()
  // TODO: Fetch the token list asynchonously before dispatching `schema`:
  const enabledTokens: Array<string> = []

  const allDenominations: {
    [currencyCode: string]: { [denomination: string]: EdgeDenomination }
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
    const denominations: Array<EdgeDenomination> = metaToken.denominations

    // Add token balance to allBalances
    nativeBalances[currencyCode] = balance
    currencyNames[currencyCode] = currencyName

    // Add all token denominations to allDenominations
    const tokenDenominations: {
      [denomination: string]: EdgeDenomination
    } = denominations.reduce((denominations, denomination) => ({ ...denominations, [denomination.multiplier]: denomination }), {})
    allDenominations[currencyCode] = tokenDenominations
  })

  const primaryNativeBalance: string = nativeBalances[currencyCode]

  const newWallet: GuiWallet = {
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
    metaTokens,
    enabledTokens,
    receiveAddress,
    blockHeight,
    symbolImage,
    symbolImageDarkMono
  }

  return newWallet
}

export const wallets = combineReducers({
  byId,
  activeWalletIds,
  archivedWalletIds,
  selectedWalletId,
  selectedCurrencyCode,
  addTokenPending,
  manageTokensPending,
  walletLoadingProgress
})
