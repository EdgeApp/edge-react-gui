import { describe, expect, it } from '@jest/globals'
import { makeMemoryDisklet } from 'disklet'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { AddressModalComponent } from '../../components/modals/AddressModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AddressModalComponent', () => {
  it('should render with loaded props', () => {
    const renderer = createRenderer()

    const fakeAccount: any = {
      disklet: makeMemoryDisklet()
    }
    const fakeWallet: any = {
      currencyInfo: {
        currencyCode: 'BTC'
      }
    }

    const actual = renderer.render(
      <AddressModalComponent
        bridge={fakeAirshipBridge}
        walletId="string"
        currencyCode="string"
        title="string"
        isFioOnly
        useUserFioAddressesOnly
        checkAddressConnected
        account={fakeAccount}
        userFioAddresses={[
          {
            name: 'string',
            bundledTxs: 11,
            walletId: 'string'
          }
        ]}
        userFioAddressesLoading
        coreWallet={fakeWallet}
        refreshAllFioAddresses={async () => {}}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
