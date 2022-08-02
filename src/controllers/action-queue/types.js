// @flow
/* eslint-disable no-use-before-define */

import { type PushEvent } from '../../controllers/push/types'

//
// Action Operations
//
export type ActionOpTypes =
  | 'seq'
  | 'par'
  | 'exchange-buy'
  | 'exchange-sell'
  | 'loan-borrow'
  | 'loan-deposit'
  | 'loan-repay'
  | 'loan-withdraw'
  | 'swap'
  | 'toast'
  | 'delay'

export type ActionOpExecStatus = 'pending' | 'active' | 'done' | Error

export type ActionOp =
  | {
      type: 'seq',
      status?: ActionOpExecStatus,
      actions: ActionOp[]
    }
  | {
      type: 'par',
      status?: ActionOpExecStatus,
      actions: ActionOp[]
    }
  | {
      type: 'broadcast-tx',
      status?: ActionOpExecStatus,
      pluginId: string,
      rawTx: Uint8Array
    }
  | {
      type: 'exchange-buy',
      status?: ActionOpExecStatus,
      nativeAmount: string,
      walletId: string,
      tokenId?: string,
      exchangePluginId: string
    }
  | {
      type: 'exchange-sell',
      status?: ActionOpExecStatus,
      nativeAmount: string,
      walletId: string,
      tokenId?: string,
      exchangePluginId: string
    }
  | {
      type: 'loan-borrow',

      status?: ActionOpExecStatus,
      stepId: number,

      borrowPluginId: string,
      nativeAmount: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'loan-deposit',
      status?: ActionOpExecStatus,
      borrowPluginId: string,
      nativeAmount: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'loan-repay',
      status?: ActionOpExecStatus,
      borrowPluginId: string,
      nativeAmount: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'loan-withdraw',
      status?: ActionOpExecStatus,
      borrowPluginId: string,
      nativeAmount: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'swap',
      status?: ActionOpExecStatus,
      fromWalletId: string,
      toWalletId: string,
      fromTokenId?: string,
      toTokenId?: string,
      nativeAmount: string,
      amountFor: 'from' | 'to'
    }
  // Useful for development/testing
  | {
      type: 'toast',
      status?: ActionOpExecStatus,
      message: string
    }
  | {
      type: 'delay',
      status?: ActionOpExecStatus,
      ms: number
    }

//
// Action (After) Effects
//

export type ActionEffect =
  | {
      type: 'seq',
      opIndex: number,
      childEffect: ActionEffect
    }
  | {
      type: 'par',
      childEffects: ActionEffect[]
    }
  | {
      type: 'address-balance',
      address: string,
      aboveAmount?: string,
      belowAmount?: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'tx-confs',
      txId: string,
      walletId: string,
      confirmations: number
    }
  | {
      type: 'price-level',
      currencyPair: string,
      aboveRate?: number,
      belowRate?: number
    }
  | {
      type: 'done',
      error?: Error
    }
  // Useful for development/testing
  | {
      type: 'unixtime',
      timestamp: number
    }
  | {
      type: 'init'
    }

//
// Action Program
//

// On Disk:
export type ActionProgram = {
  programId: string,
  actionOp: ActionOp
}

export type ActionProgramState = {
  programId: string,
  effect?: ActionEffect // result/resolves
}

//
// Internal Types
//

export type ActionQueueItem = {
  program: ActionProgram,
  state: ActionProgramState
}
export type ActionQueueMap = {
  [id: string]: ActionQueueItem
}

export type ExecutionResult = {
  effect: ActionEffect,
  action?: ActionOp // For dryrun
}
export type ExecutionResults = {
  nextState: ActionProgramState,
  pushEvents: PushEvent[],
  programState: ActionProgram
}

//
// Aciton Display API
//

export type ActionDisplayInfo = {
  title: string,
  message: string,
  status: ActionOpExecStatus,
  steps: ActionDisplayInfo[]
}
