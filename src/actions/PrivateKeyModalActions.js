// @flow

import type { Dispatch } from '../types/reduxTypes.js'
import { secondaryModalDeactivated } from './SecondaryModalActions.js'

export const sweepPrivateKeyStart = () => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_START'
})

export const sweepPrivateKeySuccess = () => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_SUCCESS'
})

export const sweepPrivateKeyFail = (error: Error) => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL',
  data: { error }
})

export const deactivated = () => (dispatch: Dispatch) => {
  setTimeout(() => dispatch(secondaryModalDeactivated()), 500)
}
