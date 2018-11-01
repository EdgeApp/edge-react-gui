// @flow

import type { EdgeCurrencyWallet, EdgeDenomination, EdgeMetaToken, EdgeReceiveAddress } from 'edge-core-js'
import _ from 'lodash'
import { type Reducer, combineReducers } from 'redux'

import type { Action, Id } from '../../modules/ReduxTypes.js'
import type { GuiWallet } from '../../types.js'

export type WalletsState = {
  byId: { [walletId: Id]: GuiWallet },
  activeWalletIds: Array<Id>,
  archivedWalletIds: Array<Id>,
  selectedWalletId: string,
  selectedCurrencyCode: string,
  addTokenPending: boolean,
  manageTokensPending: boolean,
  walletLoadingProgress: { [walletId: string]: number }
}

const byId = (state = {}, action: Action): $PropertyType<WalletsState, 'byId'> => {
  if (!action.data) return state

  switch (action.type) {
    case 'ACCOUNT_INIT_COMPLETE': {
      // $FlowFixMe
      const wallets = action.data.currencyWallets
      const out = {}

      for (const walletId of Object.keys(wallets)) {
        // $FlowFixMe
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
    case 'CORE/WALLETS/UPDATE_WALLETS': {
      // $FlowFixMe
      const wallets = action.data.currencyWallets
      const out = {}
      for (const walletId of Object.keys(wallets)) {
        // $FlowFixMe
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

    case 'UPDATE_WALLET_ENABLED_TOKENS': {
      // $FlowFixMe
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

    case 'ADD_NEW_CUSTOM_TOKEN_SUCCESS': {
      // $FlowFixMe
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

    case 'ADD_NEW_TOKEN_THEN_DELETE_OLD_SUCCESS': {
      // $FlowFixMe
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

    case 'OVERWRITE_THEN_DELETE_TOKEN_SUCCESS': {
      // adjust enabled tokens
      // $FlowFixMe
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

    case 'UI/WALLETS/UPSERT_WALLETS': {
      const { data } = action
      // $FlowFixMe
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

    case 'UI/WALLETS/REFRESH_RECEIVE_ADDRESS': {
      const {
        // $FlowFixMe
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

const walletLoadingProgress = (state = {}, action: Action): $PropertyType<WalletsState, 'walletLoadingProgress'> => {
  switch (action.type) {
    case 'INSERT_WALLET_IDS_FOR_PROGRESS': {
      if (!action.data) throw new Error('Invalid action')
      const activeWalletIdList = action.data.activeWalletIds
      const activeWalletIdProgress = {}
      activeWalletIdList.map(item => {
        activeWalletIdProgress[item] = 0
      })
      return activeWalletIdProgress
    }

    case 'UPDATE_WALLET_LOADING_PROGRESS': {
      if (!action.data) throw new Error('Invalid action')
      // prevent backwards progress
      if (action.data.addressLoadingProgress < state[action.data.walletId]) return state
      return {
        ...state,
        [action.data.walletId]: action.data.addressLoadingProgress
      }
    }

    default:
      return state
  }
}

const activeWalletIds = (state = [], action: Action): Array<string> => {
  if (!action.data) return state
  if (action.type === 'ACCOUNT_INIT_COMPLETE') {
    // $FlowFixMe
    return action.data.activeWalletIds
  }
  if (action.type === 'CORE/WALLETS/UPDATE_WALLETS') {
    // $FlowFixMe
    return action.data.activeWalletIds
  }

  return state
}

const archivedWalletIds = (state = [], action: Action): Array<string> => {
  if (!action.data) return state
  if (action.type === 'ACCOUNT_INIT_COMPLETE') {
    // $FlowFixMe
    return action.data.archivedWalletIds
  }
  if (action.type === 'CORE/WALLETS/UPDATE_WALLETS') {
    // $FlowFixMe
    return action.data.archivedWalletIds
  }

  return state
}

const selectedWalletId = (state = '', action: Action): string => {
  switch (action.type) {
    case 'UI/WALLETS/SELECT_WALLET': {
      if (action.data == null) throw new TypeError('Invalid action')
      return action.data.walletId
    }

    case 'ACCOUNT_INIT_COMPLETE': {
      if (action.data == null) throw new TypeError('Invalid action')
      return action.data.walletId
    }

    default:
      return state
  }
}

const selectedCurrencyCode = (state = '', action: Action): string => {
  switch (action.type) {
    case 'UI/WALLETS/SELECT_WALLET': {
      if (action.data == null) throw new TypeError('Invalid action')
      // $FlowFixMe
      return action.data.currencyCode
    }

    case 'ACCOUNT_INIT_COMPLETE': {
      if (action.data == null) throw new TypeError('Invalid action')
      return action.data.currencyCode
    }

    default:
      return state
  }
}

const addTokenPending = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'ADD_TOKEN_START': {
      return true
    }

    case 'ADD_TOKEN_SUCCESS': {
      return false
    }

    case 'ADD_NEW_CUSTOM_TOKEN_SUCCESS': {
      return false
    }

    case 'ADD_NEW_CUSTOM_TOKEN_FAILURE': {
      return false
    }

    default:
      return state
  }
}

const manageTokensPending = (state = false, action: Action): boolean => {
  switch (action.type) {
    case 'MANAGE_TOKENS_START': {
      return true
    }

    case 'MANAGE_TOKENS_SUCCESS': {
      return false
    }

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

export const wallets: Reducer<WalletsState, Action> = combineReducers({
  byId,
  activeWalletIds,
  archivedWalletIds,
  selectedWalletId,
  selectedCurrencyCode,
  addTokenPending,
  manageTokensPending,
  walletLoadingProgress
})
