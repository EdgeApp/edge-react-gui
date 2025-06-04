import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { AccelerateTxModalComponent } from '../../components/modals/AccelerateTxModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('AccelerateTxModalComponent', () => {
  it('should render with loading props', () => {
    const fakeWallet: any = {
      addCustomToken: 'shib',
      fiatCurrencyCode: 'iso:USD',
      currencyInfo: btcCurrencyInfo,
      currencyConfig: {
        allTokens: {},
        currencyInfo: btcCurrencyInfo
      }
    }

    const rendered = render(
      <FakeProviders>
        <AccelerateTxModalComponent
          bridge={fakeAirshipBridge}
          isoFiatCurrencyCode="iso:USD"
          replacedTx={{
            blockHeight: 0,
            currencyCode: 'BTC',
            date: 0,
            isSend: true,
            memos: [],
            nativeAmount: '-681',
            networkFee: '681',
            networkFees: [],
            otherParams: {},
            ourReceiveAddresses: ['123123123'],
            signedTx: '',
            tokenId: null,
            txid: '',
            walletId: ''
          }}
          acceleratedTx={{
            blockHeight: 0,
            currencyCode: 'BTC',
            date: 0,
            isSend: true,
            memos: [],
            nativeAmount: '-1362',
            networkFee: '1362',
            networkFees: [],
            otherParams: {},
            ourReceiveAddresses: ['123123123'],
            signedTx: '',
            tokenId: null,
            txid: '',
            walletId: ''
          }}
          wallet={fakeWallet}
          exchangeRates={{}}
          feeDisplayDenomination={{
            multiplier: '1000000',
            name: 'BTC'
          }}
          theme={getTheme()}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
