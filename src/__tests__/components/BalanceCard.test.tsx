import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { BalanceCard } from '../../components/cards/BalanceCard'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('BalanceCard', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <BalanceCard navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
