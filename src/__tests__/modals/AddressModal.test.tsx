import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { AddressModalComponent } from '../../components/modals/AddressModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AddressModalComponent', () => {
  it('should render with loaded props', () => {
    const renderer = createRenderer()

    const props: any = {
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
    const actual = renderer.render(<AddressModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
