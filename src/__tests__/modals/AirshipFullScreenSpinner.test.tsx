/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { AirshipFullScreenSpinner } from '../../components/modals/AirshipFullScreenSpinner'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AirshipFullScreenSpinner', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      // The message to show in the toast:
      message: 'string',
      theme: getTheme()
    }
    const actual = renderer.render(<AirshipFullScreenSpinner {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
