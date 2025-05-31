import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { MenuTabs } from '../../components/themed/MenuTabs'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('MenuTabs', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <MenuTabs
          // @ts-expect-error
          navigation={fakeNavigation}
          // @ts-expect-error
          state={{ index: 0, routes: [] }}
        />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
