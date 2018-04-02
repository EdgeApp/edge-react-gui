/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */

import { scan as scanReducer } from './reducer.js'

test('initialState', () => {
  const expected = {
    addressModalVisible: false,
    recipientAddress: '',
    scanEnabled: false,
    scanToWalletListModalVisibility: false,
    selectedWalletListModalVisibility: false,
    torchEnabled: false
  }
  const actual = scanReducer(undefined, {})

  expect(actual).toEqual(expected)
})
