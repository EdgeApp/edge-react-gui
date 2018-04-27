// @flow

import { combineReducers } from 'redux'

import { addressModalVisible, scanToWalletListModalVisibility, scanEnabled, selectedWalletListModalVisibility, torchEnabled, parsedUri } from './reducers'

import { legacyAddressModal } from './LegacyAddressModal/LegacyAddressModalReducer.js'

export const scan = combineReducers({
  torchEnabled,
  addressModalVisible,
  scanEnabled,
  selectedWalletListModalVisibility,
  scanToWalletListModalVisibility,
  legacyAddressModal,
  parsedUri
})

export default scan
