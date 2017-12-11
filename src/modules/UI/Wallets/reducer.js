// @flow

import {combineReducers} from 'redux'
import {GuiWallet} from '../../../types.js'
import type {AbcDenomination, AbcMetaToken} from 'airbitz-core-types'
import * as ACTION from './action'
import * as ADD_TOKEN_ACTION from '../scenes/AddToken/action.js'
import {UPDATE_WALLETS} from '../../Core/Wallets/action.js'

export const byId = (state: any = {}, action: any) => {
  const {type, data = {} } = action
  switch (type) {
  case UPDATE_WALLETS: {
    const wallets = action.data.currencyWallets
    const out = {}
    for (const walletId of Object.keys(wallets)) {
      out[walletId] = schema(wallets[walletId])
    }

    return out
  }

  case ACTION.UPSERT_WALLET:
    return {
      ...state,
      [data.wallet.id]: schema(data.wallet)
    }

  default:
    return state
  }
}

export const activeWalletIds = (state: any = [], action: any) => {
  if (action.type === UPDATE_WALLETS) {
    return action.data.activeWalletIds
  }

  return state
}

export const archivedWalletIds = (state: any = [], action: any) => {
  if (action.type === UPDATE_WALLETS) {
    return action.data.archivedWalletIds
  }

  return state
}

export const selectedWalletId = (state: string = '', action: any) => {
  const {type, data = {} } = action
  const {walletId} = data

  switch (type) {
  case ACTION.SELECT_WALLET_ID:
    return walletId
  default:
    return state
  }
}

export const selectedCurrencyCode = (state: string = '', action: any) => {
  const {type, data = {} } = action
  const {currencyCode} = data

  switch (type) {
  case ACTION.SELECT_CURRENCY_CODE:
    return currencyCode
  default:
    return state
  }
}

const addTokenPending = (state = false, action) => {
  const type = action.type
  switch (type) {
  case ADD_TOKEN_ACTION.ADD_TOKEN_START :
    return true
  case ADD_TOKEN_ACTION.ADD_TOKEN_SUCCESS :
    return false
  default:
    return state
  }
}

const manageTokensPending = (state = false, action) => {
  const type = action.type
  switch (type) {
  case ACTION.MANAGE_TOKENS_START :
    return true
  case ACTION.MANAGE_TOKENS_SUCCESS :
    return false
  default:
    return state
  }
}

function schema (wallet: any): GuiWallet {
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
  const parentDenominations = denominations.reduce((denominations, denomination) => ({
    ...denominations, [denomination.multiplier]: denomination
  }), {})

  allDenominations[currencyCode] = parentDenominations

  const nativeBalances: { [currencyCode: string]: string } = {}
  // Add parent currency balance to balances
  nativeBalances[currencyCode] = wallet.getBalance({currencyCode})

  // Add parent currency currencyCode
  const currencyNames: { [currencyCode: string]: string } = {}
  currencyNames[currencyCode] = wallet.currencyInfo.currencyName

  metaTokens.forEach((metaToken) => {
    const currencyCode: string = metaToken.currencyCode
    const currencyName: string = metaToken.currencyName
    const balance: string = wallet.getBalance({currencyCode})
    const denominations: Array<AbcDenomination> = metaToken.denominations

    // Add token balance to allBalances
    nativeBalances[currencyCode] = balance
    currencyNames[currencyCode] = currencyName

    // Add all token denominations to allDenominations
    const tokenDenominations: {
      [denomination: string]: AbcDenomination
    } = denominations.reduce((denominations, denomination) => ({...denominations, [denomination.multiplier]: denomination}), {})
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
