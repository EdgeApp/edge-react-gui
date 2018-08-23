// @flow

import { combineReducers } from 'redux'

import { legacyAddressModal } from './LegacyAddressModal/LegacyAddressModalReducer.js'
import { privateKeyModal } from './PrivateKeyModal/PrivateKeyModalReducer.js'
import { addressModalVisible, parsedUri, scanEnabled, torchEnabled } from './reducers'

export const scan = combineReducers({
  torchEnabled,
  addressModalVisible,
  scanEnabled,
  legacyAddressModal,
  privateKeyModal,
  parsedUri
})

export default scan
