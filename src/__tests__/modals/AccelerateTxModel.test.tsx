/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { AccelerateTxModelComponent } from '../../components/modals/AccelerateTxModel'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AccelerateTxModelComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      edgeTransaction: {
        blockHeight: 0,
        currencyCode: 'BTC',
        date: 0,
        nativeAmount: '-681',
        networkFee: '681',
        otherParams: {},
        ourReceiveAddresses: ['123123123'],
        signedTx: '',
        txid: ''
      },

      wallet: {
        fiatCurrencyCode: 'iso:USD',
        addCustomToken: 'shib',
        currencyInfo: {
          currencyCode: 'SHIB'
        },

        // @ts-expect-error
        parseUri: (address, currencyCode) => {}
      },
      exchangeRates: [''],

      // @ts-expect-error
      getDisplayDenomination: (pluginId, currencyCode) => ({
        multiplier: '1000000',
        name: 'BTC'
      }),

      // @ts-expect-error
      getExchangeDenomination: (pluginIdg, currencyCode) => ({
        multiplier: '1000000',
        name: 'BTC'
      }),
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<AccelerateTxModelComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
