/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { DateModalIos } from '../../components/modals/DateModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('DateModalIos', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,

      // @ts-expect-error
      initialValue: () => (number, format) => require('dateformat')(number, format, true),
      darkMode: true,

      // @ts-expect-error
      date: (number, format) => require('dateformat')(number, format, true),
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<DateModalIos {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
