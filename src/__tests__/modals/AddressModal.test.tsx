import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { makeMemoryDisklet } from 'disklet'
import * as React from 'react'

import { AddressModalComponent } from '../../components/modals/AddressModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('AddressModalComponent', () => {
  it('should render with loaded props', () => {
    const fakeDispatch: any = () => {}
    const fakeAccount: any = {
      disklet: makeMemoryDisklet()
    }
    const fakeWallet: any = {
      currencyInfo: {
        currencyCode: 'BTC'
      }
    }

    const rendered = render(
      <FakeProviders>
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
          dispatch={fakeDispatch}
          theme={getTheme()}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
