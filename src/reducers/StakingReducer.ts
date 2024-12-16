import { combineReducers, Reducer } from 'redux'

import { StakePlugin, StakePolicy, StakePosition } from '../plugins/stake-plugins/types'
import { Action } from '../types/reduxTypes'

export type StakingAction =
  | {
      type: 'STAKING/ADD_POLICY'
      walletId: string
      stakePolicy: StakePolicy
    }
  | {
      type: 'STAKING/FINISH_LOADING'
      walletId: string
    }
  | {
      type: 'STAKING/UPDATE'
      walletId: string
      stakePolicy: StakePolicy
      stakePosition: StakePosition
    }
  | {
      type: 'STAKING/UPDATE_LOCKED_AMOUNT'
      walletId: string
      lockedNativeAmount: string
    }
  | {
      type: 'STAKING/UPDATE_PLUGINS'
      walletId: string
      stakePlugins: StakePlugin[]
    }
  | {
      type: 'STAKING/UPDATE_POLICIES'
      walletId: string
      stakePolicies: StakePolicyMap
    }
  | {
      type: 'STAKING/UPDATE_POSITION'
      walletId: string
      stakePolicyId: string
      stakePosition: StakePositionMap[string]
    }
  | {
      type: 'STAKING/UPDATE_POSITIONS'
      walletId: string
      stakePositionMap: StakePositionMap
    }
  | {
      type: 'STAKING/SETUP'
      walletId: string
      lockedNativeAmount: string
      stakePlugins: StakePlugin[]
      stakePolicies: StakePolicyMap
      stakePositionMap: StakePositionMap
    }

export interface StakingState {
  walletStakingMap: WalletStakingStateMap
}

export interface WalletStakingStateMap {
  [walletId: string]: WalletStakingState
}

export interface WalletStakingState {
  isLoaded: boolean
  lockedNativeAmount: string
  stakePlugins: StakePlugin[]
  stakePolicies: StakePolicyMap
  stakePositionMap: StakePositionMap
}

export interface StakePolicyMap {
  [policyId: string]: StakePolicy
}

export interface StakePositionMap {
  [policyId: string]: StakePosition
}

export const staking: Reducer<StakingState, Action> = combineReducers({
  walletStakingMap: (state = {}, action: Action) => {
    if (action.type.startsWith('STAKING/')) {
      const typeHack = action as StakingAction
      return {
        ...state,
        [typeHack.walletId]: walletStakingStateReducer(state[typeHack.walletId], action)
      }
    }
    return state
  }
})

export const walletStakingStateReducer: Reducer<WalletStakingState, Action> = combineReducers({
  isLoaded: (state = false, action: Action) => {
    // Persist the loading state if it's true
    switch (action.type) {
      case 'STAKING/FINISH_LOADING':
      case 'STAKING/SETUP':
        return true
      default:
        return state
    }
  },
  lockedNativeAmount: (state = '0', action: Action) => {
    switch (action.type) {
      case 'STAKING/UPDATE_LOCKED_AMOUNT':
      case 'STAKING/SETUP':
        return action.lockedNativeAmount
      default:
        return state
    }
  },
  stakePlugins: (state = [], action: Action) => {
    switch (action.type) {
      case 'STAKING/UPDATE_PLUGINS':
      case 'STAKING/SETUP':
        return action.stakePlugins
      default:
        return state
    }
  },
  stakePolicies: (state = {}, action: Action) => {
    switch (action.type) {
      case 'STAKING/ADD_POLICY':
      case 'STAKING/UPDATE': {
        return { ...state, [action.stakePolicy.stakePolicyId]: action.stakePolicy }
      }
      case 'STAKING/UPDATE_POLICIES':
      case 'STAKING/SETUP':
        return action.stakePolicies
      default:
        return state
    }
  },
  stakePositionMap: (state = {}, action: Action) => {
    switch (action.type) {
      case 'STAKING/UPDATE':
        return { ...state, [action.stakePolicy.stakePolicyId]: action.stakePosition }
      case 'STAKING/UPDATE_POSITION':
        return { ...state, [action.stakePolicyId]: action.stakePosition }
      case 'STAKING/UPDATE_POSITIONS':
      case 'STAKING/SETUP':
        return action.stakePositionMap
      default:
        return state
    }
  }
})

export const defaultWalletStakingState = walletStakingStateReducer(undefined, { type: 'DUMMY_ACTION_PLEASE_IGNORE' })
