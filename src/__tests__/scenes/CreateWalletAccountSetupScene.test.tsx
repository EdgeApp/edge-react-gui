import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CreateWalletAccountSetupScene } from '../../components/scenes/CreateWalletAccountSetupScene'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('CreateWalletAccountSelect', () => {
  it('renders', () => {
    const mockState: FakeState = {
      core: {
        account: {
          currencyConfig: {
            bitcoin: { currencyInfo: btcCurrencyInfo }
          },
          currencyWallets: {
            '332s0ds39f': { currencyInfo: btcCurrencyInfo }
          },
          watch: () => () => {}
        }
      }
    }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <CreateWalletAccountSetupScene
          {...fakeEdgeAppSceneProps('createWalletAccountSetup', {
            accountHandle: '',
            isReactivation: true,
            walletId: '332s0ds39f'
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
