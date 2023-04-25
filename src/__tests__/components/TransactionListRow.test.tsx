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
            blockHeight: 10,
            currencyCode: 'BTC',
            date: 123456789,
            dateString: 'Sat Sep 17 2022 22:53:08 GMT-0700 (Pacific Daylight Time)',
            nativeAmount: '-100001',
            isSend: true,
            networkFee: '100000',
            ourReceiveAddresses: [],
            signedTx: '0x12897491827459823745',
            time: '22:53:08',
            txid: '0x182748768724897ef897234',
            unfilteredIndex: 0,
            walletId: 'lmnop'
          }}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
