import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { LargeUtxoWalletCard } from '../../components/cards/LargeUtxoWalletCard'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('LargeUtxoWalletCard', () => {
  it('should render', () => {
    const rendered = render(
      <FakeProviders>
        <LargeUtxoWalletCard />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
