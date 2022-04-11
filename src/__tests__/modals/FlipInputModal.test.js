/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FlipInputModalComponent } from '../../components/modals/FlipInputModal'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('FlipInputModalComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      walletId: 'myWallet',
      currencyCode: 'BTC',
      onFeesChange: () => undefined,
      balanceCrypto: '10000',
      flipInputHeaderText: 'Exchange Header',
      flipInputHeaderLogo: 'https://content.edge.app/bitcoin/bitcoin/exchange/bc1',
      primaryInfo: {
        displayCurrencyCode: 'BTC',
        exchangeCurrencyCode: 'BTC',
        displayDenomination: { multiplier: '100000000000', name: 'BTC' },
        exchangeDenomination: { multiplier: '100000000000', name: 'BTC' }
      },
      secondaryInfo: {
        displayCurrencyCode: 'BTC',
        exchangeCurrencyCode: 'BTC',
        displayDenomination: {
          name: 'Bitcoin',
          multiplier: '1'
        },
        exchangeDenomination: {
          name: 'Bitcoin',
          multiplier: '1'
        }
      },
      fiatPerCrypto: '1000',
      overridePrimaryExchangeAmount: '0',
      forceUpdateGuiCounter: 123,
      pluginId: 'Wyre',
      feeCurrencyCode: 'BTC',
      feeDisplayDenomination: { multiplier: '100000000000', name: 'BTC' },
      feeExchangeDenomination: { multiplier: '100000000000', name: 'BTC' },
      feeNativeAmount: '1',
      feeAmount: '1',
      updateMaxSpend: (walletId, currencyCode) => undefined,
      updateTransactionAmount: (nativeAmount, exchangeAmount, walletId, currencyCode) => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<FlipInputModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
