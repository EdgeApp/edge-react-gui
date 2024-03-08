import { EdgeTokenId } from 'edge-core-js'
import { Reducer } from 'redux'

import { Action } from '../types/reduxTypes'

export interface CryptoExchangeState {
  fromWalletId: string | null
  fromTokenId: EdgeTokenId
  fromNativeAmount: string

  toWalletId: string | null
  toTokenId: EdgeTokenId
  toNativeAmount: string
}

const initialState: CryptoExchangeState = {
  fromWalletId: null,
  fromTokenId: null,
  fromNativeAmount: '0',

  toWalletId: null,
  toTokenId: null,
  toNativeAmount: '0'
}

function cryptoExchangeInner(state = initialState, action: Action): CryptoExchangeState {
  switch (action.type) {
    case 'SELECT_FROM_WALLET_CRYPTO_EXCHANGE': {
      return {
        ...state,
        fromWalletId: action.data.walletId,
        fromTokenId: action.data.tokenId,
        fromNativeAmount: '0',
        toNativeAmount: '0'
      }
    }

    case 'SELECT_TO_WALLET_CRYPTO_EXCHANGE': {
      return {
        ...state,
        toWalletId: action.data.walletId,
        toTokenId: action.data.tokenId,
        fromNativeAmount: '0',
        toNativeAmount: '0'
      }
    }

    case 'SHIFT_COMPLETE': {
      return { ...initialState }
    }

    default:
      return state
  }
}

// Nuke the state on logout:
export const cryptoExchange: Reducer<CryptoExchangeState, Action> = (state, action: Action) => {
  if (action.type === 'LOGOUT') {
    return cryptoExchangeInner(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
  }

  return cryptoExchangeInner(state, action)
}
