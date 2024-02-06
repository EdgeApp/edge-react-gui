import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { RequestSceneComponent } from '../../components/scenes/RequestScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <RequestSceneComponent
        {...fakeSceneProps('request', { tokenId: null, walletId: '' })}
        isConnected={false}
        currencyCode={null as any}
        wallet={null as any}
        exchangeSecondaryToPrimaryRatio={null as any}
        primaryCurrencyInfo={null as any}
        theme={getTheme()}
        refreshAllFioAddresses={async () => {}}
        onSelectWallet={async (walletId, currencyCode) => {}}
        toggleAccountBalanceVisibility={() => {}}
        showBalance
      />
    )

    expect(actual).toMatchSnapshot()
  })

  it('should render with loaded props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' },
      balanceMap: new Map([[null, '1234']])
    }

    const actual = renderer.render(
      <RequestSceneComponent
        {...fakeSceneProps('request', { tokenId: null, walletId: '' })}
        isConnected={false}
        currencyCode="BTC"
        wallet={fakeWallet}
        exchangeSecondaryToPrimaryRatio={{} as any}
        primaryCurrencyInfo={{ tokenId: null, displayDenomination: { multiplier: '100000000' }, exchangeDenomination: { multiplier: '100000000' } } as any}
        theme={getTheme()}
        refreshAllFioAddresses={async () => {}}
        onSelectWallet={async (walletId, currencyCode) => {}}
        toggleAccountBalanceVisibility={() => {}}
        showBalance
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
