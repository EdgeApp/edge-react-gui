import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { CryptoFiatAmountTile } from '../../components/tiles/CryptoFiatAmountTile'
import { initialState } from '../../reducers/scenes/SettingsReducer'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'

const fakeCurrencyConfig = makeFakeCurrencyConfig(ethCurrencyInfo)

const fakeState: FakeState = {
  exchangeRates: {
    crypto: {
      ethereum: { '': { 'iso:USD': { current: 3000 } } }
    },
    fiat: {
      'iso:USD': { 'iso:USD': { current: 1 } }
    }
  },
  ui: { settings: { ...initialState, defaultIsoFiat: 'iso:USD' } }
}

describe('CryptoFiatAmountTile', () => {
  it.each([
    ['ETH', '1000000000000000000', '0.0027459886 ETH'],
    ['mETH', '1000000000000000', '2.7459886406 mETH']
  ])(
    'prices the amount per exchange unit when displayed in %s',
    (name, multiplier, cryptoText) => {
      const rendered = render(
        <FakeProviders initialState={fakeState}>
          <CryptoFiatAmountTile
            title="Network Fee"
            nativeCryptoAmount="2745988640600000"
            denomination={{ name, multiplier }}
            currencyConfig={fakeCurrencyConfig}
            tokenId={null}
          />
        </FakeProviders>
      )

      expect(rendered.getByText(`${cryptoText} ($8.23)`)).toBeTruthy()
      rendered.unmount()
    }
  )
})
