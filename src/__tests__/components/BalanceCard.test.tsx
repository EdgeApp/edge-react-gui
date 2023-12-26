import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import renderer from 'react-test-renderer'

import { BalanceCardUi4 } from '../../components/ui4/BalanceCardUi4'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('BalanceCard', () => {
  it('should render with loading props', () => {
    const actual = renderer.create(
      <FakeProviders>
        <BalanceCardUi4 navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(actual).toMatchSnapshot()
  })
})
