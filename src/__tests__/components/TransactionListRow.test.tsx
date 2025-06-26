import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { TransactionCard } from '../../components/themed/TransactionListRow'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('TransactionListRow', () => {
  it('should render with loading props', () => {
    const fakeCurrencyConfig = makeFakeCurrencyConfig(btcCurrencyInfo)
    const fakeWallet: any = {
      id: 'lmnop',
      pluginId: 'bitcoin',
      watch: () => {},
      currencyConfig: fakeCurrencyConfig,
      currencyInfo: fakeCurrencyConfig.currencyInfo,
      fiatCurrencyCode: 'iso:USD'
    }

    const mockStore: FakeState = {
      core: {
        account: {
          currencyConfig: {
            bitcoin: fakeCurrencyConfig
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
