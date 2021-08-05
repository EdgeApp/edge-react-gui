// @flow

import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../types/reduxTypes.js'
import { type PrivateKeyModalState, privateKeyModal } from '../PrivateKeyModalReducer.js'
import { scanEnabled } from '../ScanEnabledReducer.js'
import { torchEnabled } from '../TorchEnabledReducer.js'

export type ScanState = {
  +torchEnabled: boolean,
  +scanEnabled: boolean,
  +privateKeyModal: PrivateKeyModalState
}

export const scan: Reducer<ScanState, Action> = combineReducers({
  privateKeyModal,
  scanEnabled,
  torchEnabled
})
