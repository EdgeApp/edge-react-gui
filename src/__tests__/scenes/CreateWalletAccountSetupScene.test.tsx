import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CreateWalletAccountSetupScene } from '../../components/scenes/CreateWalletAccountSetupScene'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('CreateWalletAccountSelect', () => {
  it('renders', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <CreateWalletAccountSetupScene
          {...fakeSceneProps('createWalletAccountSetup', {
            accountHandle: '',
            selectedWalletType: {
              currencyName: 'bitcoin',
              walletType: 'wallet:bitcoin',
              currencyCode: 'BTC'
            } as any,
            isReactivation: true,
            existingWalletId: 'myWallet'
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
