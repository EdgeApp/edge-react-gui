import { add } from 'biggystring'
import { EdgeTransaction } from 'edge-core-js'

import { BroadcastTx, PendingTxMap } from '../../../../controllers/action-queue/types'
import { ApprovableAction } from '../../types'

export const composeApprovableActions = (...actions: ApprovableAction[]): ApprovableAction => {
  if (
    !actions.every((action, index, actions) => index === actions.length - 1 || action.networkFee.currencyCode === actions[index + 1].networkFee.currencyCode)
  ) {
    // TODO: Maybe we should consider a different for networkFee
    throw new Error('Cannot compose ApprovableActions with different networkFee currencyCodes')
  }

  const currencyCode = actions[0].networkFee.currencyCode
  const nativeAmount = actions.reduce((sum, action) => add(sum, action.networkFee.nativeAmount), '0')
  const unsignedTxs = actions.reduce((txs: EdgeTransaction[], action) => [...txs, ...action.unsignedTxs], [])

  return {
    networkFee: {
      currencyCode,
      nativeAmount
    },
    unsignedTxs,
    dryrun: async (pendingTxMap: PendingTxMap) => {
      // Copy map so as not to mutate it for the caller.
      const pendingTxMapCopy = { ...pendingTxMap }

      const out: BroadcastTx[] = []
      for (const action of actions) {
        const outputs = await action.dryrun(pendingTxMapCopy)
        // Add dryrun outputs to pendingTxMap
        for (const output of outputs) {
          const { walletId, tx } = output
          pendingTxMapCopy[walletId] = [...(pendingTxMapCopy[output.walletId] ?? []), tx]
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
