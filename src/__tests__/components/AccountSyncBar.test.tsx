import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { AccountSyncBar } from '../../components/progress-indicators/AccountSyncBar'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('ProgressBar', () => {
  const mockState: FakeState = {
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
    const rendered = render(
      <FakeProviders initialState={mockState}>
        <AccountSyncBar />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
