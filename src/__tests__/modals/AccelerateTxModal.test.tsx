import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { AccelerateTxModalComponent } from '../../components/modals/AccelerateTxModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AccelerateTxModalComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
      fiatCurrencyCode: 'iso:USD',
      addCustomToken: 'shib',
      currencyInfo: {
        currencyCode: 'SHIB'
      }
    }

    const actual = renderer.render(
      <AccelerateTxModalComponent
        bridge={fakeAirshipBridge}
        replacedTx={{
          blockHeight: 0,
          currencyCode: 'BTC',
          date: 0,
          isSend: true,
          memos: [],
          nativeAmount: '-681',
          networkFee: '681',
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
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
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
          txid: '',
          walletId: ''
        }}
        wallet={fakeWallet}
        exchangeRates={{}}
        getDisplayDenomination={(pluginId, currencyCode) => ({
          multiplier: '1000000',
          name: 'BTC'
        })}
        getExchangeDenomination={(pluginIdg, currencyCode) => ({
          multiplier: '1000000',
          name: 'BTC'
        })}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
