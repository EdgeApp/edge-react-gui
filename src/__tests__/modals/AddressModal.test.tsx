/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { AddressModalComponent } from '../../components/modals/AddressModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AddressModalComponent', () => {
  it('should render with loaded props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      walletId: 'string',
      currencyCode: 'string',
      title: 'string',
      isFioOnly: true,
      useUserFioAddressesOnly: true,
      checkAddressConnected: true,
      account: {
        disklet: {
          // @ts-expect-error
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
    // @ts-expect-error
    const actual = renderer.render(<AddressModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
