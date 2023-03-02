import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { MenuTabs } from '../../components/themed/MenuTabs'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('MenuTabs', () => {
  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <MenuTabs
          // @ts-expect-error
          navigation={fakeNavigation}
          // @ts-expect-error
          state={{ index: 0, routes: [] }}
        />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
