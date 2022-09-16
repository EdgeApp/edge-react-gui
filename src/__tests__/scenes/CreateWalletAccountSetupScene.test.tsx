import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CreateWalletAccountSetup } from '../../components/scenes/CreateWalletAccountSetupScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('CreateWalletAccountSelect', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
      navigation: fakeNavigation,
      route: {
        name: 'createWalletAccountSetup',
        params: {
          accountHandle: '',
          selectedWalletType: {
            currencyName: 'bitcoin',
            walletType: 'wallet:bitcoin',
            symbolImage: 'BTC',
            currencyCode: 'BTC'
          },
          selectedFiat: {
            label: 'USD',
            value: 'USD'
          },
          isReactivation: true,
          existingWalletId: 'myWallet'
        }
      },

      handleAvailableStatus: 'AVAILABLE',
      isCheckingHandleAvailability: true,
      currencyConfigs: { bitcoin: { currencyInfo: { pluginId: 'bitcoin', currencyCode: 'BTC' } } },
      // @ts-expect-error
      checkHandleAvailability: handle => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<CreateWalletAccountSetup {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
