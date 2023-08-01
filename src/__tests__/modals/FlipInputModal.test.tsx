import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FlipInputModalComponent } from '../../components/modals/FlipInputModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('FlipInputModalComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {}

    const actual = renderer.render(
      <FlipInputModalComponent
        bridge={fakeAirshipBridge}
        navigation={fakeNavigation}
        walletId="myWallet"
        wallet={fakeWallet}
        currencyCode="BTC"
        onFeesChange={() => undefined}
        balanceCrypto="10000"
        flipInputHeaderText="Exchange Header"
        primaryInfo={
          {
            tokenId: undefined,
            displayCurrencyCode: 'BTC',
            exchangeCurrencyCode: 'BTC',
            displayDenomination: { multiplier: '100000000000', name: 'BTC' },
            exchangeDenomination: { multiplier: '100000000000', name: 'BTC' }
          } as any
        }
        secondaryInfo={
          {
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
          } as any
        }
        fiatPerCrypto="1000"
        overridePrimaryExchangeAmount="0"
        forceUpdateGuiCounter={123}
        pluginId="Wyre"
        feeDisplayDenomination={{ multiplier: '100000000000', name: 'BTC' }}
        feeNativeAmount="1"
        feeAmount="1"
        updateMaxSpend={async (walletId, currencyCode) => {}}
        updateTransactionAmount={(nativeAmount, exchangeAmount, walletId, currencyCode) => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
