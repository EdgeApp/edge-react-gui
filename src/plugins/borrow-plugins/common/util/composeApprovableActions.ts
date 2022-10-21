import { add } from 'biggystring'
import { EdgeTransaction } from 'edge-core-js'

import { BroadcastTx, PendingTxMap } from '../../../../controllers/action-queue/types'
import { ApprovableAction } from '../../types'
import { SIDE_EFFECT_CURRENCY_CODE } from '../constants'

export const composeApprovableActions = (...actions: ApprovableAction[]): ApprovableAction => {
  if (
    !actions.every(
      (action, index, actions) =>
        action.networkFee.currencyCode !== SIDE_EFFECT_CURRENCY_CODE ||
        index === actions.length - 1 ||
        action.networkFee.currencyCode === actions[index + 1].networkFee.currencyCode
    )
  ) {
    // TODO: Maybe we should consider a different for networkFee
    throw new Error('Cannot compose ApprovableActions with different networkFee currencyCodes')
  }

  const currencyCode = actions[0].networkFee.currencyCode
  const nativeAmount = actions.reduce(
    (sum, action) => (action.networkFee.currencyCode !== SIDE_EFFECT_CURRENCY_CODE ? add(sum, action.networkFee.nativeAmount) : sum),
    '0'
  )
  const unsignedTxs = actions.reduce((txs: EdgeTransaction[], action) => [...txs, ...action.unsignedTxs], [])

  return {
    networkFee: {
      currencyCode,
      nativeAmount
    },
    unsignedTxs,
    dryrun: async pendingTxMap => {
      // Copy map because we can't mutate; only the caller can mutate it.
      const pendingTxMapLocal: PendingTxMap = { ...pendingTxMap }

      const out: BroadcastTx[] = []
      for (const action of actions) {
        const outputs = await action.dryrun(pendingTxMapLocal)
        // Add dryrun outputs to pendingTxMap
        for (const output of outputs) {
          const { walletId, tx } = output
          pendingTxMapLocal[walletId] = [...(pendingTxMapLocal[output.walletId] ?? []), tx]
        }
        // Push dryrun outputs to return value
        out.push(...outputs)
      }
      return out
    },
    approve: async () => {
      const outputs: BroadcastTx[] = []
      for (const action of actions) {
        outputs.push(...(await action.approve()))
      }
      return outputs
    }
  }
}
