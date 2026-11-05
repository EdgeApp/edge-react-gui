import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'

import * as DeviceSettingsActions from '../../actions/DeviceSettingsActions'
import { SafeSlider } from '../../components/themed/SafeSlider'
import { lstrings } from '../../locales/strings'
import { asDeviceSettings } from '../../types/types'
import { FakeProviders } from '../../util/fake/FakeProviders'

const enableButtonMode = (): void => {
  jest.spyOn(DeviceSettingsActions, 'getDeviceSettings').mockReturnValue({
    ...asDeviceSettings({}),
    slidersAsButtons: true
  })
}

describe('SafeSlider', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders a slider when the developer option is off', () => {
    const rendered = render(
      <FakeProviders>
        <SafeSlider disabled={false} onSlidingComplete={() => {}} />
      </FakeProviders>
    )

    expect(
      rendered.queryByText(lstrings.send_confirmation_slide_to_confirm)
    ).not.toBeNull()
    expect(
      rendered.queryByText(lstrings.send_confirmation_button_confirm)
    ).toBeNull()
    rendered.unmount()
  })

  it('runs the completion handler from the button', async () => {
    enableButtonMode()
    const onSlidingComplete = jest.fn<(reset: () => void) => void>()

    const rendered = render(
      <FakeProviders>
        <SafeSlider disabled={false} onSlidingComplete={onSlidingComplete} />
      </FakeProviders>
    )

    expect(
      rendered.queryByText(lstrings.send_confirmation_slide_to_confirm)
    ).toBeNull()
    await act(async () => {
      fireEvent.press(rendered.getByTestId('confirmSliderThumb'))
    })
    expect(onSlidingComplete).toHaveBeenCalledTimes(1)

    // A second press while the action is in flight does nothing:
    await act(async () => {
      fireEvent.press(rendered.getByTestId('confirmSliderThumb'))
    })
    expect(onSlidingComplete).toHaveBeenCalledTimes(1)

    // The reset callback re-arms the button:
    const reset = onSlidingComplete.mock.calls[0][0]
    await act(async () => {
      reset()
    })
    await act(async () => {
      fireEvent.press(rendered.getByTestId('confirmSliderThumb'))
    })
    expect(onSlidingComplete).toHaveBeenCalledTimes(2)
    rendered.unmount()
  })

  it('blocks presses and shows the disabled text when disabled', async () => {
    enableButtonMode()
    const onSlidingComplete = jest.fn<(reset: () => void) => void>()

    const rendered = render(
      <FakeProviders>
        <SafeSlider
          disabled
          disabledText="Enter an amount"
          onSlidingComplete={onSlidingComplete}
        />
      </FakeProviders>
    )

    expect(rendered.queryByText('Enter an amount')).not.toBeNull()
    await act(async () => {
      fireEvent.press(rendered.getByTestId('confirmSliderThumb'))
    })
    expect(onSlidingComplete).not.toHaveBeenCalled()
    rendered.unmount()
  })

  it('shows the locked text and blocks presses when locked', async () => {
    enableButtonMode()
    const onSlidingComplete = jest.fn<(reset: () => void) => void>()

    const rendered = render(
      <FakeProviders>
        <SafeSlider
          disabled={false}
          lockedText="Sent"
          onSlidingComplete={onSlidingComplete}
        />
      </FakeProviders>
    )

    expect(rendered.queryByText('Sent')).not.toBeNull()
    await act(async () => {
      fireEvent.press(rendered.getByTestId('confirmSliderThumb'))
    })
    expect(onSlidingComplete).not.toHaveBeenCalled()
    rendered.unmount()
  })
})
