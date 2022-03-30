/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { AirshipFullScreenSpinner } from '../../components/modals/AirshipFullScreenSpinner'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('AirshipFullScreenSpinner', () => {
  it('should render with loading props', () => {
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
