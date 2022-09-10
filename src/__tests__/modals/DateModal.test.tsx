/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { DateModalIos } from '../../components/modals/DateModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('DateModalIos', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      initialValue: () => (number, format) => require('dateformat')(number, format, true),
      darkMode: true,
      date: (number, format) => require('dateformat')(number, format, true),
      theme: getTheme()
    }
    const actual = renderer.render(<DateModalIos {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
