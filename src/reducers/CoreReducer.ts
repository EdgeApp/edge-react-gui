import { Disklet } from 'disklet'
import { EdgeAccount, EdgeContext } from 'edge-core-js/types'
import { combineReducers } from 'redux'

import { showError } from '../components/services/AirshipInstance'
import { Action } from '../types/reduxTypes'

export interface CoreState {
  readonly account: EdgeAccount
  readonly context: EdgeContext
  readonly disklet: Disklet
  readonly otpErrorShown: boolean
  readonly enabledDetectedTokens: { [walletId: string]: string[] }
}

const flowHack: any = {}
const defaultContext: EdgeContext = flowHack
const defaultDisklet: Disklet = flowHack

const accountHack: any = {
  activeWalletIds: [],
  currencyConfig: {},
  currencyWallets: {},
  rootLoginId: '',
  watch: () => () => {}
}
export const defaultAccount: EdgeAccount = accountHack

export const core = combineReducers<CoreState, Action>({
  account(state: EdgeAccount = defaultAccount, action: Action): EdgeAccount {
    switch (action.type) {
      case 'LOGIN':
        return action.data.account
      case 'LOGOUT':
        return defaultAccount
      default:
        return state
    }
  },

  context(state: EdgeContext = defaultContext, action: Action): EdgeContext {
    return action.type === 'CORE/CONTEXT/ADD_CONTEXT' ? action.data.context : state
  },

  disklet(state: Disklet = defaultDisklet, action: Action): Disklet {
    return action.type === 'CORE/CONTEXT/ADD_CONTEXT' ? action.data.disklet : state
  },

  otpErrorShown(state: boolean = false, action: Action): boolean {
    switch (action.type) {
      case 'OTP_ERROR_SHOWN':
        return true
      case 'LOGOUT':
        return false
      default:
        return state
    }
  },

  enabledDetectedTokens(state: { [walletId: string]: string[] } = {}, action: Action): { [walletId: string]: string[] } {
    switch (action.type) {
      case 'CORE/NEW_TOKENS': {
        const newState = { ...state }
        const { walletId, enablingTokenIds } = action.data

        if (enablingTokenIds.length === 0) showError(`enabledDetectedTokens: Received empty tokens array for ${walletId}`)

        if (newState[walletId] != null) {
          // Merge token arrays
          newState[walletId] = Array.from(new Set([...newState[walletId], ...enablingTokenIds]))
        } else {
          newState[walletId] = enablingTokenIds
        }

        return newState
      }
      case 'CORE/DISMISS_NEW_TOKENS': {
        // Clear out the new tokens array for this wallet
        const { [action.data.walletId]: _, ...newState } = state
        return newState
      }
      default:
        return state
    }
  }
})
