/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FlipInputModalComponent } from '../../components/modals/FlipInputModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('FlipInputModalComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      walletId: 'myWallet',
      currencyCode: 'BTC',
      onFeesChange: () => undefined,
      balanceCrypto: '10000',
      flipInputHeaderText: 'Exchange Header',
      primaryInfo: {
        tokenId: undefined,
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

      // @ts-expect-error
      updateMaxSpend: (walletId, currencyCode) => undefined,

      // @ts-expect-error
      updateTransactionAmount: (nativeAmount, exchangeAmount, walletId, currencyCode) => undefined,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<FlipInputModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
