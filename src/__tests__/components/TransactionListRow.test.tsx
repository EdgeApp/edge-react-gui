import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { TransactionListRow } from '../../components/themed/TransactionListRow'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('TransactionListRow', () => {
  it('should render with loading props', () => {
    const currencyInfo = {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      displayName: 'Bitcoin',
      requiredConfirmations: 1,
      denominations: [
        { name: 'BTC', multiplier: '100000000', symbol: '₿' },
        { name: 'mBTC', multiplier: '100000', symbol: 'm₿' },
        { name: 'bits', multiplier: '100', symbol: 'ƀ' },
        { name: 'sats', multiplier: '1', symbol: 's' }
      ]
    }
    const fakeWallet: any = {
      id: 'lmnop',
      pluginId: 'bitcoin',
      watch: () => {},
      currencyInfo,
      fiatCurrencyCode: 'iso:USD'
    }

    const mockStore: FakeState = {
      core: {
        account: {
          currencyConfig: {
            bitcoin: {
              allTokens: {},
              currencyInfo
            }
          }
        }
      }
    }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockStore}>
        <TransactionListRow
          navigation={fakeNavigation}
          wallet={fakeWallet}
          currencyCode="BTC"
          transaction={{
            walletId: 'lmnop',
            dateString: 'Sat Sep 17 2022 22:53:08 GMT-0700 (Pacific Daylight Time)',
            time: '22:53:08',
            unfilteredIndex: 0,
            currencyCode: 'BTC',
            nativeAmount: '1',
            networkFee: '0.001',
            blockHeight: 10,
            date: 123456789,
            txid: '0x182748768724897ef897234',
            signedTx: '0x12897491827459823745',
            ourReceiveAddresses: []
          }}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
