import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { RequestSceneComponent } from '../../components/scenes/RequestScene'
import { getTheme } from '../../components/services/ThemeContext'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('Request', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
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
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render with loaded props', () => {
    const fakeWallet: any = {
      currencyInfo: btcCurrencyInfo,
      currencyConfig: {
        allTokens: {},
        currencyInfo: btcCurrencyInfo
      },
      balanceMap: new Map([[null, '1234']]),
      on: () => () => {}
    }

    const rendered = render(
      <FakeProviders>
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
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render a blank scene with loaded props', () => {
    const fakeWallet: any = {
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' },
      balanceMap: new Map([[null, '1234']]),
      on: () => () => {}
    }

    const rendered = render(
      <FakeProviders>
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
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
