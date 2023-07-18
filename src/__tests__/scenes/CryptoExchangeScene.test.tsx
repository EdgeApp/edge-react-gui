import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CryptoExchangeComponent } from '../../components/scenes/CryptoExchangeScene'
import { getTheme } from '../../components/services/ThemeContext'
import { initialState } from '../../reducers/ExchangeInfoReducer'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('CryptoExchangeComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeAccount: any = {}

    const actual = renderer.render(
      <CryptoExchangeComponent
        overscroll={0}
        {...fakeSceneProps('exchange', {})}
        account={fakeAccount}
        exchangeInfo={initialState}
        fromWalletId=""
        fromWalletBalances={[''] as any}
        fromFiatCurrencyCode="USD"
        fromIsoFiatCurrencyCode="iso:USD"
        fromWalletName="BTC Wallet"
        fromExchangeAmount="1000"
        fromWalletPrimaryInfo={
          {
            displayCurrencyCode: 'BTC',
            exchangeCurrencyCode: 'BTC'
          } as any
        }
        fromFiatToCrypto="500"
        toWalletId=""
        toFiatCurrencyCode="USD"
        toIsoFiatCurrencyCode="iso:USD"
        toWalletName="ETH Wallet"
        toExchangeAmount="1000"
        toWalletPrimaryInfo={
          {
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
          } as any
        }
        toFiatToCrypto="500"
        pluginId="ChangeNow"
        fromCurrencyCode="BTC"
        toCurrencyCode="ETH"
        hasMaxSpend
        insufficient={false}
        genericError={null}
        onSelectWallet={async (walletId, currencyCode, direction) => undefined}
        getQuoteForTransaction={(fromWalletNativeAmount, onApprove) => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
