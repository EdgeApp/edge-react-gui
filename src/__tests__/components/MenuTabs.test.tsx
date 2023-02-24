import { describe, expect, it } from '@jest/globals'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { MenuTabs } from '../../components/themed/MenuTabs'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('MenuTabs', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: BottomTabBarProps = { navigation: fakeNavigation, state: { index: 0, routes: [] } } as any

    const actual = renderer.render(<MenuTabs {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
