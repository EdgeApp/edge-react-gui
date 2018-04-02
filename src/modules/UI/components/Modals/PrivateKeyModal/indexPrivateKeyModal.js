// @flow

import { PrivateKeyModal } from './PrivateKeyModalConnector.js'
import { PrivateKeyModalComponent } from './PrivateKeyModal.ui.js'
import { PrivateKeyModalReducer } from './PrivateKeyModalReducer.js'
import {
  SWEEP_PRIVATE_KEY_START,
  SWEEP_PRIVATE_KEY_SUCCESS,
  SWEEP_PRIVATE_KEY_FAIL,
  DISMISS_MODAL,
  RESET,
  sweepPrivateKey,
  dismissModal,
  reset
} from './PrivateKeyModalActions.js'

import { PRIVATE_KEY_SCANNED } from '../../../scenes/Scan/action.js'

export {
  PrivateKeyModal,
  PrivateKeyModalComponent,
  PrivateKeyModalReducer,
  sweepPrivateKey,
  dismissModal,
  reset,
  SWEEP_PRIVATE_KEY_START,
  SWEEP_PRIVATE_KEY_SUCCESS,
  SWEEP_PRIVATE_KEY_FAIL,
  DISMISS_MODAL,
  RESET,
  PRIVATE_KEY_SCANNED
}
