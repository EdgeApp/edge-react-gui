// @flow

import type { EdgeParsedUri } from 'edge-core-js'
import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../modules/ReduxTypes.js'
import { addressModalVisibleReducer } from '../AddressModalVisibleReducer.js'
import { legacyAddressModal } from '../LegacyAddressModalReducer.js'
import { parsedUri } from '../ParsedUriReducer.js'
import { type PrivateKeyModalState, privateKeyModal } from '../PrivateKeyModalReducer.js'
import { scanEnabled } from '../ScanEnabledReducer.js'
import { torchEnabled } from '../TorchEnabledReducer.js'

export type ScanState = {
  +parsedUri: EdgeParsedUri | null,
  +torchEnabled: boolean,
  +addressModalVisible: boolean,
  +scanEnabled: boolean,
  +legacyAddressModal: {
    isActive: boolean
  },
  +privateKeyModal: PrivateKeyModalState
}

export const scan: Reducer<ScanState, Action> = combineReducers({
  addressModalVisible: addressModalVisibleReducer,
  legacyAddressModal,
  parsedUri,
  privateKeyModal,
  scanEnabled,
  torchEnabled
})
