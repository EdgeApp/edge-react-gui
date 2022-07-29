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

export type ActionOp =
  | {
      type: 'seq',
      actions: ActionOp[]
    }
  | {
      type: 'par',
      actions: ActionOp[]
    }
  | {
      type: 'broadcast-tx',
      pluginId: string,
      rawTx: Uint8Array
    }
  | {
      type: 'exchange-buy',
      nativeAmount: string,
      walletId: string,
      tokenId?: string,
      exchangePluginId: string
    }
  | {
      type: 'exchange-sell',
      nativeAmount: string,
      walletId: string,
      tokenId?: string,
      exchangePluginId: string
    }
  | {
      type: 'loan-borrow',
      borrowPluginId: string,
      nativeAmount: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'loan-deposit',
      borrowPluginId: string,
      nativeAmount: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'loan-repay',
      borrowPluginId: string,
      nativeAmount: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'loan-withdraw',
      borrowPluginId: string,
      nativeAmount: string,
      walletId: string,
      tokenId?: string
    }
  | {
      type: 'swap',
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
      message: string
    }
  | {
      type: 'delay',
      ms: number
    }

//
// Action Effects
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
  effect?: ActionEffect
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
  pushEvents: PushEvent[]
}

//
// Aciton Display API
//

export type ActionDisplayInfo = {
  title: string,
  message: string,
  status: 'pending' | 'doing' | 'done' | Error,
  steps: ActionDisplayInfo[]
}
