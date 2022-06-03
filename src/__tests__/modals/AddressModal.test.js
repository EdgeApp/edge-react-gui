/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { AddressModalComponent } from '../../components/modals/AddressModal.js'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('AddressModalComponent', () => {
  it('should render with loaded props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      walletId: 'string',
      currencyCode: 'string',
      title: 'string',
      isFioOnly: true,
      useUserFioAddressesOnly: true,
      checkAddressConnected: true,
      generateTestHook: () => undefined,
      account: {
        disklet: {
          getText: async path => {}
        }
      },
      userFioAddresses: [
        {
          name: 'string',
          bundledTxs: 11,
          walletId: 'string'
        }
      ],
      userFioAddressesLoading: true,
      coreWallet: {
        currencyInfo: {
          currencyCode: 'BTC'
        }
      },
      refreshAllFioAddresses: () => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<AddressModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
