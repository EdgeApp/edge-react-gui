import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { BuyCrypto } from '../../components/themed/BuyCrypto'
import { initialState } from '../../reducers/scenes/SettingsReducer'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('BuyCrypto', () => {
  const mockState: FakeState = {
    ui: {
      settings: {
        ...initialState,
        defaultIsoFiat: 'iso:DOLLA'
      }
    }
  }

  it('should render with some props', () => {
    const fakeWallet: any = {
      id: 'my wallet',
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' }
    }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={mockState}>
        <BuyCrypto wallet={fakeWallet} tokenId={undefined} navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
