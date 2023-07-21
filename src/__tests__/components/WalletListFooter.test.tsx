import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { WalletListFooter } from '../../components/themed/WalletListFooter'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('WalletListFooter', () => {
  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <WalletListFooter navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
