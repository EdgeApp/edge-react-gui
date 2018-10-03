// @flow

import type { EdgeTransaction } from 'edge-core-js'

export const displayTransactionAlert = (edgeTransaction: EdgeTransaction) => ({
  type: 'UI/COMPONENTS/TRANSACTION_ALERT/DISPLAY_TRANSACTION_ALERT',
  data: { edgeTransaction }
})

export const dismissTransactionAlert = () => ({
  type: 'UI/COMPONENTS/TRANSACTION_ALERT/DISMISS_TRANSACTION_ALERT',
  data: { edgeTransaction: '' }
})
