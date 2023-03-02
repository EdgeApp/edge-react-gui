import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import renderer from 'react-test-renderer'

import { BuyCrypto } from '../../components/themed/BuyCrypto'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

describe('BuyCrypto', () => {
  const mockState: FakeState = {
    ui: {
      settings: {
        defaultIsoFiat: 'iso:DOLLA'
      }
    }
  }

  it('should render with some props', () => {
    const fakeWallet: any = {
      id: 'my wallet',
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' }
    }

    const actual = renderer.create(
      <FakeProviders initialState={mockState}>
        <BuyCrypto wallet={fakeWallet} tokenId={undefined} navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(actual).toMatchSnapshot()
  })
})
