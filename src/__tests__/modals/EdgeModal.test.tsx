import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { BackHandler, Text } from 'react-native'
import { State } from 'react-native-gesture-handler'
import {
  fireGestureHandler,
  getByGestureTestId
} from 'react-native-gesture-handler/jest-utils'

import { EdgeModal } from '../../components/modals/EdgeModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

// Tests run as iOS, where the back button is a stub. React Native ships a
// mock that remembers listeners and can press the button:
jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  default: jest.requireActual(
    'react-native/Libraries/Utilities/__mocks__/BackHandler'
  )
}))

const handleCancel = jest.fn()

const renderModal = (closeButtonOnly: boolean): ReturnType<typeof render> =>
  render(
    <FakeProviders>
      <EdgeModal
        bridge={fakeAirshipBridge}
        closeButtonOnly={closeButtonOnly}
        onCancel={handleCancel}
        title="Some modal"
      >
        <Text>Some content</Text>
      </EdgeModal>
    </FakeProviders>
  )

// Drags the modal down well past the distance that closes it. The first
// active event only starts the gesture; the next one moves the modal:
const dragDown = async (): Promise<void> => {
  fireGestureHandler(getByGestureTestId('modal-drag'), [
    { state: State.BEGAN, translationY: 0 },
    { state: State.ACTIVE, translationY: 0 },
    { translationY: 400 },
    { state: State.END, translationY: 400 }
  ])
  // The gesture reaches React through runOnJS, which queues a microtask:
  await act(async () => {
    jest.runAllTicks()
  })
}

// The hardware back button, which only Android has:
const pressBack = (): void => {
  const { mockPressBack } = BackHandler as unknown as {
    mockPressBack: () => void
  }
  mockPressBack()
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('EdgeModal', () => {
  it('closes from the close button, the backdrop, the back button, and a drag', async () => {
    const rendered = renderModal(false)

    fireEvent.press(rendered.getByTestId('modal-close-button'))
    expect(handleCancel).toHaveBeenCalledTimes(1)

    fireEvent.press(rendered.getByTestId('modal-backdrop'))
    expect(handleCancel).toHaveBeenCalledTimes(2)

    pressBack()
    expect(handleCancel).toHaveBeenCalledTimes(3)

    await dragDown()
    expect(handleCancel).toHaveBeenCalledTimes(4)

    rendered.unmount()
  })

  it('closes only from the close button when told to', async () => {
    const rendered = renderModal(true)

    fireEvent.press(rendered.getByTestId('modal-backdrop'))
    pressBack()
    await dragDown()
    expect(handleCancel).not.toHaveBeenCalled()

    fireEvent.press(rendered.getByTestId('modal-close-button'))
    expect(handleCancel).toHaveBeenCalledTimes(1)

    rendered.unmount()
  })
})
