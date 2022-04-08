/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CryptoExchangeComponent } from '../../components/scenes/CryptoExchangeScene.js'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('CryptoExchangeComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      fromWalletId: '',
      fromWalletBalances: [''],
      fromFiatCurrencyCode: 'USD',
      fromIsoFiatCurrencyCode: {
        wallet: {
          fiatCurrencyCode: 'USD'
        }
      },
      fromWalletName: 'BTC Wallet',
      fromExchangeAmount: '1000',
      fromWalletPrimaryInfo: {
        displayCurrencyCode: 'BTC',
        exchangeCurrencyCode: 'BTC'
      },
      displayDenomination: {
        multiplier: '10000000',
        name: 'Bitcoin'
      },
      exchangeDenomination: {
        multiplier: '10000000',
        name: 'Sats'
      },
      fromFiatToCrypto: '500',
      toWalletId: '',
      toFiatCurrencyCode: 'USD',
      toIsoFiatCurrencyCode: {
        wallet: {
          fiatCurrencyCode: 'USD'
        }
      },
      toWalletName: 'ETH Wallet',
      toExchangeAmount: '1000',
      toWalletPrimaryInfo: {
        displayCurrencyCode: 'ETH',
        exchangeCurrencyCode: 'ETH',
        displayDenomination: {
          multiplier: '100000000',
          name: 'Ethereum'
        },
        exchangeDenomination: {
          multiplier: '10000000',
          name: 'Gwei'
        }
      },
      toFiatToCrypto: '500',
      pluginId: 'ChangeNow',
      fromCurrencyCode: 'BTC',
      toCurrencyCode: 'ETH',
      forceUpdateGuiCounter: 0,
      calculatingMax: true,
      hasMaxSpend: true,
      insufficient: false,
      genericError: null,
      onSelectWallet: async (walletId, currencyCode, direction) => undefined,
      getQuoteForTransaction: (fromWalletNativeAmount, onApprove) => undefined,
      exchangeMax: async () => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<CryptoExchangeComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
