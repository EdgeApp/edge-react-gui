// @flow

import type { Dispatch } from '../modules/ReduxTypes.js'
import { secondaryModalDeactivated } from './SecondaryModalActions.js'

export const sweepPrivateKeyStart = () => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_START'
})

export const sweepPrivateKeySuccess = () => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_SUCCESS',
  data: {}
})

export const sweepPrivateKeyFail = (error: Error) => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_FAIL',
  data: { error }
})

export const sweepPrivateKeyReset = () => ({
  type: 'PRIVATE_KEY_MODAL/SWEEP_PRIVATE_KEY_RESET',
  data: {}
})

export const deactivated = () => (dispatch: Dispatch) => {
  setTimeout(() => dispatch(secondaryModalDeactivated()), 500)
}
