import { add } from 'biggystring'

import { BroadcastTx } from '../../../../controllers/action-queue/types'
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

  return {
    networkFee: {
      currencyCode,
      nativeAmount
    },
    // @ts-expect-error
    unsignedTxs: actions.reduce((txs, action) => [...txs, ...action.unsignedTxs], []),
    dryrun: async () => {
      const outputs: BroadcastTx[] = []
      for (const action of actions) {
        outputs.push(...(await action.dryrun()))
      }
      return outputs
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
