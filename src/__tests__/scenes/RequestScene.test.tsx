import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { RequestSceneComponent } from '../../components/scenes/RequestScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <RequestSceneComponent
        account={null as any}
        navigation={fakeNavigation}
        isConnected={false}
        currencyCode={null as any}
        wallet={null as any}
        exchangeSecondaryToPrimaryRatio={null as any}
        primaryCurrencyInfo={null as any}
        secondaryCurrencyInfo={null as any}
        theme={getTheme()}
        refreshAllFioAddresses={() => undefined}
        onSelectWallet={(walletId, currencyCode) => undefined}
      />
    )

    expect(actual).toMatchSnapshot()
  })

  it('should render with loaded props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' },
      balances: { BTC: '1234' }
    }

    const actual = renderer.render(
      <RequestSceneComponent
        account={null as any}
        navigation={fakeNavigation}
        isConnected={false}
        currencyCode="BTC"
        wallet={fakeWallet}
        exchangeSecondaryToPrimaryRatio={{} as any}
        primaryCurrencyInfo={{ displayDenomination: { multiplier: '100000000' }, exchangeDenomination: { multiplier: '100000000' } } as any}
        secondaryCurrencyInfo={{} as any}
        theme={getTheme()}
        refreshAllFioAddresses={() => undefined}
        onSelectWallet={(walletId, currencyCode) => undefined}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
