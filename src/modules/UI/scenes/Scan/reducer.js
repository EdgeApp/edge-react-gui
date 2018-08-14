// @flow

import { combineReducers } from 'redux'

import { legacyAddressModal } from './LegacyAddressModal/LegacyAddressModalReducer.js'
import { privateKeyModal } from './PrivateKeyModal/PrivateKeyModalReducer.js'
import { addressModalVisible, parsedUri, scanEnabled, scanToWalletListModalVisibility, selectedWalletListModalVisibility, torchEnabled } from './reducers'

export const scan = combineReducers({
  torchEnabled,
  addressModalVisible,
  scanEnabled,
  selectedWalletListModalVisibility,
  scanToWalletListModalVisibility,
  legacyAddressModal,
  privateKeyModal,
  parsedUri
})

export default scan
