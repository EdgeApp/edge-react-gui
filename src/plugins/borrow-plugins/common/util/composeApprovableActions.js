// @flow
import { add } from 'biggystring'
import { type EdgeTransaction } from 'edge-core-js'

import { type ApprovableAction } from '../../types'

export const composeApprovableActions = (...actions: ApprovableAction[]): ApprovableAction => {
  if (
    !actions.every((action, index, actions) => index === actions.length - 1 || action.networkFee.currencyCode === actions[index + 1].networkFee.currencyCode)
  ) {
    // TODO: Maybe we should consider a different type for networkFee
    throw new Error('Cannot compose ApprovableActions with different networkFee currencyCodes')
  }

  const currencyCode = actions[0].networkFee.currencyCode
  const nativeAmount = actions.reduce((sum, action) => add(sum, action.networkFee.nativeAmount), '0')

  return {
    networkFee: {
      currencyCode,
      nativeAmount
    },
    unsignedTxs: actions.reduce((txs, action) => [...txs, ...action.unsignedTxs], []),
    approve: async () => {
      const txs: EdgeTransaction[] = []
      for (const action of actions) {
        txs.push(...(await action.approve()))
      }
      return txs
    }
  }
}
