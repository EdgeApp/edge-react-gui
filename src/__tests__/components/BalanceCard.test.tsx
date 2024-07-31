import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { BalanceCard } from '../../components/cards/BalanceCard'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('BalanceCard', () => {
  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <BalanceCard navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
