import { describe, expect, it, jest } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import { View } from 'react-native'

import { type TabBlurNavigation, useTabBlur } from '../../hooks/useTabBlur'

/**
 * A stand-in for the tab navigator a scene reaches through `getParent`. The
 * route list is what the real guard reads, so the tests move `index` the way
 * react-navigation does before it delivers the blur.
 */
const makeTabNavigation = (
  index: number
): {
  navigation: TabBlurNavigation
  blur: () => void
  focus: (name: string) => void
  unsubscribed: () => boolean
} => {
  const routes = [{ name: 'buyTab' }, { name: 'sellTab' }, { name: 'swapTab' }]
  const state = { index, routes }
  let listener: (() => void) | undefined
  let unsubscribed = false

  const tabNavigation = {
    addListener: (event: 'blur', callback: () => void) => {
      listener = callback
      return () => {
        unsubscribed = true
      }
    },
    getState: () => state
  }
  return {
    navigation: { getParent: () => tabNavigation },
    blur: () => {
      if (listener != null) listener()
    },
    focus: (name: string) => {
      state.index = routes.findIndex(route => route.name === name)
    },
    unsubscribed: () => unsubscribed
  }
}

interface ProbeProps {
  navigation: TabBlurNavigation
  tab: string
  onLeave: () => void
}

const Probe: React.FC<ProbeProps> = props => {
  useTabBlur(props.navigation, props.tab, props.onLeave)
  return <View />
}

describe('useTabBlur', () => {
  it('calls onLeave when the tab navigator has moved off the tab', () => {
    const tabs = makeTabNavigation(1)
    const onLeave = jest.fn()
    render(
      <Probe navigation={tabs.navigation} tab="sellTab" onLeave={onLeave} />
    )

    // React Navigation moves the tab navigator before it delivers the blur:
    tabs.focus('swapTab')
    tabs.blur()

    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('ignores a blur that leaves the tab navigator on the tab', () => {
    const tabs = makeTabNavigation(1)
    const onLeave = jest.fn()
    render(
      <Probe navigation={tabs.navigation} tab="sellTab" onLeave={onLeave} />
    )

    // A scene pushed above the tabs, such as the `send2` deposit a sell
    // needs, blurs the tab without moving the tab navigator:
    tabs.blur()

    expect(onLeave).not.toHaveBeenCalled()
  })

  it('calls the latest onLeave without resubscribing', () => {
    const tabs = makeTabNavigation(2)
    const first = jest.fn()
    const second = jest.fn()
    const rendered = render(
      <Probe navigation={tabs.navigation} tab="swapTab" onLeave={first} />
    )
    rendered.rerender(
      <Probe navigation={tabs.navigation} tab="swapTab" onLeave={second} />
    )

    tabs.focus('buyTab')
    tabs.blur()

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(tabs.unsubscribed()).toBe(false)
  })

  it('unsubscribes when the scene unmounts', () => {
    const tabs = makeTabNavigation(0)
    const onLeave = jest.fn()
    const rendered = render(
      <Probe navigation={tabs.navigation} tab="buyTab" onLeave={onLeave} />
    )

    rendered.unmount()

    expect(tabs.unsubscribed()).toBe(true)
  })

  it('does nothing when the scene has no parent navigator', () => {
    const navigation: TabBlurNavigation = { getParent: () => undefined }
    const onLeave = jest.fn()

    expect(() =>
      render(<Probe navigation={navigation} tab="buyTab" onLeave={onLeave} />)
    ).not.toThrow()
    expect(onLeave).not.toHaveBeenCalled()
  })
})
