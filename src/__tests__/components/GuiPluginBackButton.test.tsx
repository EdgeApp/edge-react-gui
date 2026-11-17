import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import type * as ReactNative from 'react-native'

import {
  PluginBackButton,
  setPluginScene
} from '../../components/navigation/GuiPluginBackButton'

jest.mock('../../components/navigation/BackButton', () => {
  const { TouchableOpacity } =
    jest.requireActual<typeof ReactNative>('react-native')
  return {
    BackButton: (props: { onPress: () => void }) => (
      <TouchableOpacity testID="backButton" onPress={props.onPress} />
    )
  }
})

const makeScene = (): { goBack: jest.Mock<() => boolean> } => ({
  goBack: jest.fn(() => true)
})

const pressBack = (): void => {
  const { getByTestId, unmount } = render(<PluginBackButton />)
  fireEvent.press(getByTestId('backButton'))
  unmount()
}

// The button's owner is module state, so each test releases what it took:
let releases: Array<() => void> = []
const register = (scene: ReturnType<typeof makeScene>): (() => void) => {
  const release = setPluginScene(scene)
  releases.push(release)
  return release
}

afterEach(() => {
  releases.forEach(release => {
    release()
  })
  releases = []
})

describe('PluginBackButton', () => {
  it('acts on the scene that registered last', () => {
    const buyScene = makeScene()
    const sellScene = makeScene()
    register(buyScene)
    register(sellScene)

    pressBack()

    expect(sellScene.goBack).toHaveBeenCalledTimes(1)
    expect(buyScene.goBack).not.toHaveBeenCalled()
  })

  it('keeps the newly focused scene when the old one blurs after it', () => {
    // React Navigation can focus the new tab's scene before it blurs the old:
    const buyScene = makeScene()
    const sellScene = makeScene()
    const releaseBuy = register(buyScene)
    register(sellScene)
    releaseBuy()

    pressBack()

    expect(sellScene.goBack).toHaveBeenCalledTimes(1)
    expect(buyScene.goBack).not.toHaveBeenCalled()
  })

  it('hands the button to the scene focused after a release', () => {
    const buyScene = makeScene()
    const sellScene = makeScene()
    const releaseBuy = register(buyScene)
    releaseBuy()
    register(sellScene)

    pressBack()

    expect(sellScene.goBack).toHaveBeenCalledTimes(1)
    expect(buyScene.goBack).not.toHaveBeenCalled()
  })

  it('does nothing once the scene holding it releases it', () => {
    const buyScene = makeScene()
    const releaseBuy = register(buyScene)
    releaseBuy()

    expect(pressBack).not.toThrow()
    expect(buyScene.goBack).not.toHaveBeenCalled()
  })
})
