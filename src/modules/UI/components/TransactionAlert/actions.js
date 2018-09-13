// @flow

import type { EdgeTransaction } from 'edge-core-js'

export const displayTransactionAlert = (edgeTransaction: EdgeTransaction) => ({
  type: 'UI/components/TransactionAlert/DISPLAY_TRANSACTION_ALERT',
  data: { edgeTransaction }
})

export const dismissTransactionAlert = () => ({
  type: 'UI/components/TransactionAlert/DISMISS_TRANSACTION_ALERT',
  data: { edgeTransaction: '' }
})
