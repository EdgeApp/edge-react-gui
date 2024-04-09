import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { WiredProgressBar } from '../../components/themed/WiredProgressBar'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('ProgressBar', () => {
  const mockState: FakeState = {
    ui: {
      wallets: {
        walletLoadingProgress: {
          x: 0.5
        }
      }
    },
    core: {
      account: {
        activeWalletIds: ['x', 'y'],
        currencyWallets: {
          x: {
            watch: () => () => {},
            syncRatio: 1,
            currencyInfo: { pluginId: 'lol' }
          },
          y: {
            watch: () => () => {},
            syncRatio: 0,
            currencyInfo: { pluginId: 'lol2' }
          }
        },
        currencyWalletErrors: {},

        watch: () => () => {}
      }
    }
  }

  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <WiredProgressBar />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
