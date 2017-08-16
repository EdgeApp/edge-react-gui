// @flow

import { combineReducers } from 'redux'
import * as ACTION from './action'

export const byId = (state:any = {}, action:any) => {
  const { type, data = {} } = action
  switch (type) {
    case ACTION.UPSERT_WALLET:
      return {
        ...state,
        [data.wallet.id]: schema(data.wallet)
      }

    case ACTION.DELETE_WALLET: {
      const { walletId } = data
      const newState = Object.assign({}, state)
      delete newState[walletId]
      return newState
    }

    default:
      return state
  }
}

export const activeWalletIds = (state:any = [], action:any) => {
  const { type, data = {} } = action
  const { wallet } = data
  switch (type) {
    case ACTION.UPSERT_WALLET:
      if (!wallet.archived) {
        return getNewArrayWithItem(state, wallet.id)
      }
      return getNewArrayWithoutItem(state, wallet.id)
    default:
      return state
  }
}

export const archivedWalletIds = (state:any = [], action:any) => {
  const { type, data = {} } = action
  const { wallet } = data
  switch (type) {
    case ACTION.UPSERT_WALLET:
      if (!wallet.archived || wallet.deleted) {
        return getNewArrayWithoutItem(state, wallet.id)
      }
      return getNewArrayWithItem(state, wallet.id)
    default:
      return state
  }
}

export const selectedWalletId = (state:string = '', action:any) => {
  const { type, data = {} } = action
  const { walletId } = data

  switch (type) {
    case ACTION.SELECT_WALLET_ID:
      return walletId
    default:
      return state
  }
}

export const selectedCurrencyCode = (state:string = '', action:any) => {
  const { type, data = {} } = action
  const { currencyCode } = data

  switch (type) {
    case ACTION.SELECT_CURRENCY_CODE:
      return currencyCode
    default:
      return state
  }
}

const schema = wallet => {
  const id:string = wallet.id
  const type:string = wallet.type
  const name:string = wallet.name || 'no wallet name'
  const sortIndex = wallet.sortIndex
  const archived = wallet.archived
  const deleted = wallet.deleted

  const currencyCode = wallet.currencyInfo.currencyCode
  const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')
  const isoFiatCurrencyCode = wallet.fiatCurrencyCode
  const symbolImage = wallet.currencyInfo.symbolImage
  const metaTokens = wallet.currencyInfo.metaTokens
  const denominations = wallet.currencyInfo.denominations

  const allDenominations = {}
  allDenominations[currencyCode] = {}
  // Add all parent wallet denominations to allDenominations
  denominations.forEach(denomination => {
    allDenominations[currencyCode][denomination.multiplier] = denomination
  })

  const nativeBalances = {}
  // Add parent wallet balance to balances
  nativeBalances[currencyCode] = wallet.getBalance({ currencyCode })
  const currencyNames = {}
  currencyNames[currencyCode] = wallet.currencyInfo.currencyName

  metaTokens.forEach(metaToken => {
    const currencyCode = metaToken.currencyCode
    const currencyName = metaToken.currencyName
    const tokenBalance = wallet.getBalance({ currencyCode })
    const tokenDenominations = metaToken.denominations

    // Add token balance to allBalances
    metaToken.balance = tokenBalance
    nativeBalances[currencyCode] = tokenBalance
    currencyNames[currencyCode] = currencyName

    // Add all token denominations to allDenominations
    allDenominations[currencyCode] = {}
    tokenDenominations.forEach(denomination => {
      allDenominations[currencyCode][denomination.multiplier] = denomination
    })
  })

  const primaryNativeBalance = nativeBalances[currencyCode]

  const newWallet = {
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
    metaTokens,
    sortIndex,
    archived,
    deleted
  }

  return newWallet
}

const getNewArrayWithoutItem = (list, targetItem) => {
  return list.filter(item => {
    return item !== targetItem
  })
}

const getNewArrayWithItem = (list, item) => {
  if (!list.includes(item)) {
    return [...list, item]
  }
  return list
}

export const wallets = combineReducers({
  byId,
  activeWalletIds,
  archivedWalletIds,
  selectedWalletId,
  selectedCurrencyCode
})
