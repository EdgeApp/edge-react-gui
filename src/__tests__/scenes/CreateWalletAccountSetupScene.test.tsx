import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CreateWalletAccountSetup } from '../../components/scenes/CreateWalletAccountSetupScene'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { fakeNonce } from '../../util/fake/fakeNonce'

describe('CreateWalletAccountSelect', () => {
  const nonce = fakeNonce(0)

  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <CreateWalletAccountSetup
        navigation={fakeNavigation}
        route={{
          key: `createWalletAccountSetup-${nonce()}`,
          name: 'createWalletAccountSetup',
          params: {
            accountHandle: '',
            selectedWalletType: {
              currencyName: 'bitcoin',
              walletType: 'wallet:bitcoin',
              currencyCode: 'BTC'
            } as any,
            selectedFiat: {
              label: 'USD',
              value: 'USD'
            },
            isReactivation: true,
            existingWalletId: 'myWallet'
          }
        }}
        handleAvailableStatus="AVAILABLE"
        isCheckingHandleAvailability
        currencyConfigs={{
          bitcoin: {
            currencyInfo: { pluginId: 'bitcoin', currencyCode: 'BTC' }
          } as any
        }}
        checkHandleAvailability={handle => undefined}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
