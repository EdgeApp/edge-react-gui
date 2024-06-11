import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { AccountSyncBar } from '../../components/progress-indicators/AccountSyncBar'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('ProgressBar', () => {
  const mockState: FakeState = {
    core: {
      account: {
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
        <AccountSyncBar />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
