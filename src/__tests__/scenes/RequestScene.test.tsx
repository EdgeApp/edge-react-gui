import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { RequestSceneComponent } from '../../components/scenes/RequestScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <RequestSceneComponent
        {...fakeEdgeAppSceneProps('request', { tokenId: null, walletId: '' })}
        isConnected={false}
        isLightAccount={false}
        fioAddressesExist={false}
        currencyCode={null as any}
        wallet={null as any}
        exchangeSecondaryToPrimaryRatio={null as any}
        displayDenomination={null as any}
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
        {...fakeEdgeAppSceneProps('request', { tokenId: null, walletId: '' })}
        isConnected={false}
        isLightAccount={false}
        fioAddressesExist={false}
        currencyCode="BTC"
        wallet={fakeWallet}
        exchangeSecondaryToPrimaryRatio={{} as any}
        displayDenomination={{ multiplier: '100000000', name: 'BTC' }}
        theme={getTheme()}
        refreshAllFioAddresses={async () => {}}
        onSelectWallet={async (walletId, currencyCode) => {}}
        toggleAccountBalanceVisibility={() => {}}
        showBalance
      />
    )

    expect(actual).toMatchSnapshot()
  })

  it('should render a blank scene with loaded props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' },
      balanceMap: new Map([[null, '1234']])
    }

    const actual = renderer.render(
      <RequestSceneComponent
        {...fakeEdgeAppSceneProps('request', { tokenId: null, walletId: '' })}
        isConnected={false}
        isLightAccount
        fioAddressesExist={false}
        currencyCode="BTC"
        wallet={fakeWallet}
        exchangeSecondaryToPrimaryRatio={{} as any}
        displayDenomination={{ multiplier: '100000000', name: 'BTC' }}
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
