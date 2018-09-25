// @flow

import type { EdgeParsedUri } from 'edge-core-js'
import { type Reducer, combineReducers } from 'redux'

import { type Action } from '../../../ReduxTypes.js'
import { legacyAddressModal } from './LegacyAddressModal/LegacyAddressModalReducer.js'
import { type PrivateKeyModalState, privateKeyModal } from './PrivateKeyModal/PrivateKeyModalReducer.js'
import { addressModalVisible } from './reducers/addressModalVisible.js'
import { parsedUri } from './reducers/parsedUri.js'
import { scanEnabled } from './reducers/scanEnabled.js'
import { torchEnabled } from './reducers/torchEnabled.js'

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
  addressModalVisible,
  legacyAddressModal,
  parsedUri,
  privateKeyModal,
  scanEnabled,
  torchEnabled
})
