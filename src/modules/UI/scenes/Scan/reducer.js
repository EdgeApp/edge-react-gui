// @flow

import { combineReducers } from 'redux'

import {
  addressModalVisible,
  recipientAddress,
  scanEnabled,
  scanToWalletListModalVisibility,
  selectedWalletListModalVisibility,
  torchEnabled
} from './reducers'

export const scan = combineReducers({
  torchEnabled,
  addressModalVisible,
  recipientAddress,
  scanEnabled,
  selectedWalletListModalVisibility,
  scanToWalletListModalVisibility
})

export default scan
