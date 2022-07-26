// @flow

import { type EdgeAccount } from 'edge-core-js'

import { type PushEvent, type PushTrigger } from '../push/types'
import { type ActionEffect, type ActionOp, type ExecutionResult } from './types'

export function preparePushEvents(account: EdgeAccount, precomputed: ExecutionResult[]): PushEvent[] {
  return precomputed.map(result => {
    const { effect, action } = result
    const trigger = actionEffectToPushTrigger(account, effect)

    if (action == null) throw new Error(`Push event preparation failed. Action required in execution results`)

    const { broadcastTxs } = actionOpToPushEventParams(action)

    return {
      trigger,
      triggered: false,
      broadcastTxs
    }
  })
}

function actionEffectToPushTrigger(account: EdgeAccount, effect: ActionEffect): PushTrigger {
  switch (effect.type) {
    case 'address-balance': {
      const { address, walletId, tokenId, aboveAmount, belowAmount } = effect
      const wallet = account.currencyWallets[walletId]
      const { pluginId } = wallet.currencyInfo
      return {
        type: 'address-balance',
        pluginId,
        tokenId,
        address,
        aboveAmount,
        belowAmount
      }
    }
    case 'price-level': {
      const { currencyPair, aboveRate, belowRate } = effect
      return {
        type: 'price-level',
        currencyPair,
        aboveRate,
        belowRate
      }
    }
    case 'tx-confs': {
      const { confirmations, walletId, txId } = effect
      const wallet = account.currencyWallets[walletId]
      const { pluginId } = wallet.currencyInfo

      return {
        type: 'tx-confirm',
        pluginId,
        confirmations,
        txid: txId
      }
    }
    default:
      throw new Error(`Unexpected effect type '${effect.type}' when converting to PushEventParams`)
  }
}

type PushEventParams = {
  pushMessage?: string,
  pushPayload?: mixed,
  broadcastTxs?: Array<{
    pluginId: string,
    rawTx: Uint8Array
  }>
}

function actionOpToPushEventParams(action: ActionOp): PushEventParams {
  switch (action.type) {
    case 'broadcast-tx': {
      const { pluginId, rawTx } = action
      return {
        broadcastTxs: [
          {
            pluginId,
            rawTx
          }
        ]
      }
    }
    default:
      throw new Error(`Unexpected actionOp type '${action.type}' when converting to PushEventParams`)
  }
}
