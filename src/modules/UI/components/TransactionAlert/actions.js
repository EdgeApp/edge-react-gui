// @flow

import type { EdgeTransaction } from 'edge-core-js'

import { playReceiveSound } from '../../../../actions/SoundActions.js'

export const displayTransactionAlert = (edgeTransaction: EdgeTransaction) => {
  playReceiveSound().catch(error => console.log(error)) // Fail quietly
  return {
    type: 'UI/COMPONENTS/TRANSACTION_ALERT/DISPLAY_TRANSACTION_ALERT',
    data: { edgeTransaction }
  }
}

export const dismissTransactionAlert = () => ({
  type: 'UI/COMPONENTS/TRANSACTION_ALERT/DISMISS_TRANSACTION_ALERT',
  data: { edgeTransaction: '' }
})
