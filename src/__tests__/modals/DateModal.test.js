// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { DateModalIos } from '../../components/modals/DateModal'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('DateModalIos', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
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
