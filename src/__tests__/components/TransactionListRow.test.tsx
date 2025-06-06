import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { TransactionCard } from '../../components/themed/TransactionListRow'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('TransactionListRow', () => {
  it('should render with loading props', () => {
    const currencyInfo = {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      displayName: 'Bitcoin',
      assetDisplayName: 'Bitcoin',
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
      currencyConfig: {
        allTokens: {},
        currencyInfo
      },
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

    const rendered = render(
      <FakeProviders initialState={mockStore}>
        <TransactionCard
          navigation={fakeNavigation}
          wallet={fakeWallet}
          transaction={{
            blockHeight: 10,
            currencyCode: 'BTC',
            date: 123456789,
            nativeAmount: '-100001',
            isSend: true,
            memos: [],
            networkFee: '100000',
            networkFees: [],
            ourReceiveAddresses: [],
            signedTx: '0x12897491827459823745',
            tokenId: null,
            txid: '0x182748768724897ef897234',
            walletId: 'lmnop'
          }}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
