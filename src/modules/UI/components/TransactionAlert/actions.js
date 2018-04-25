// @flow

import type { EdgeTransaction } from 'edge-core-js'

const PREFIX = 'UI/components/TransactionAlert/'
export const DISPLAY_TRANSACTION_ALERT = PREFIX + 'DISPLAY_TRANSACTION_ALERT'
export const DISMISS_TRANSACTION_ALERT = PREFIX + 'DISMISS_TRANSACTION_ALERT'

export const displayTransactionAlert = (edgeTransaction: EdgeTransaction) => ({
  type: DISPLAY_TRANSACTION_ALERT,
  data: { edgeTransaction }
})

export const dismissTransactionAlert = () => ({
  type: DISMISS_TRANSACTION_ALERT,
  data: { edgeTransaction: '' }
})
