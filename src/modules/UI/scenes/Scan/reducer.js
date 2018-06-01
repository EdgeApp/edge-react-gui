// @flow

import { combineReducers } from 'redux'

import { addressModalVisible, scanToWalletListModalVisibility, scanEnabled, selectedWalletListModalVisibility, torchEnabled, parsedUri } from './reducers'

import { legacyAddressModal } from './LegacyAddressModal/LegacyAddressModalReducer.js'
import { privateKeyModal } from './PrivateKeyModal/PrivateKeyModalReducer.js'

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
