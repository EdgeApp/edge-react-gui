import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CreateWalletAccountSetup } from '../../components/scenes/CreateWalletAccountSetupScene'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('CreateWalletAccountSelect', () => {
  const fakeAccount: any = {
    currencyConfig: {
      bitcoin: {
        allTokens: {},
        currencyInfo: { pluginId: 'bitcoin', currencyCode: 'BTC' }
      } as any
    }
  }

  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <CreateWalletAccountSetup
        {...fakeSceneProps('createWalletAccountSetup', {
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
        })}
        handleAvailableStatus="AVAILABLE"
        isCheckingHandleAvailability
        account={fakeAccount}
        checkHandleAvailability={handle => undefined}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
