import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { AccelerateTxModelComponent } from '../../components/modals/AccelerateTxModel'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AccelerateTxModelComponent', () => {
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
      <AccelerateTxModelComponent
        bridge={fakeAirshipBridge}
        edgeTransaction={{
          walletId: '',
          blockHeight: 0,
          currencyCode: 'BTC',
          date: 0,
          nativeAmount: '-681',
          networkFee: '681',
          otherParams: {},
          ourReceiveAddresses: ['123123123'],
          signedTx: '',
          txid: ''
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
