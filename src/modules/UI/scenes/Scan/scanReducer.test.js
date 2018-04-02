/* globals test expect */

import {
  scan as scanReducer,
  addressModalVisible,
  recipientAddress,
  scanEnabled,
  scanToWalletListModalVisibility,
  selectedWalletListModalVisibility,
  torchEnabled,
  parsedUri
} from './reducer.js'

test('initialState', () => {
  const expected = {
    addressModalVisible: addressModalVisible(undefined, {}),
    recipientAddress: recipientAddress(undefined, {}),
    scanEnabled: scanEnabled(undefined, {}),
    scanToWalletListModalVisibility: scanToWalletListModalVisibility(undefined, {}),
    selectedWalletListModalVisibility: selectedWalletListModalVisibility(undefined, {}),
    torchEnabled: torchEnabled(undefined, {}),
    parsedUri: parsedUri(undefined, {})
  }
  const actual = scanReducer(undefined, {})

  expect(actual).toEqual(expected)
})
