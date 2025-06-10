import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

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
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' },
      watch: () => {},
      syncRatio: 0.5
    }

    const rendered = render(
      <FakeProviders initialState={mockState}>
        <BuyCrypto wallet={fakeWallet} tokenId={null} navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
