// @flow

import { combineReducers } from 'redux'

import {
  addressModalVisible,
  scanEnabled,
  scanToWalletListModalVisibility,
  selectedWalletListModalVisibility,
  torchEnabled
} from './reducers'

export const scan = combineReducers({
  torchEnabled,
  addressModalVisible,
  scanEnabled,
  selectedWalletListModalVisibility,
  scanToWalletListModalVisibility
})

export default scan
