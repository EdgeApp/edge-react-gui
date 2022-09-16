import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { DateModalIos } from '../../components/modals/DateModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('DateModalIos', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
      bridge: fakeAirshipBridge,
      // @ts-expect-error
      initialValue: () => (number, format) => require('dateformat')(number, format, true),
      darkMode: true,
      // @ts-expect-error
      date: (number, format) => require('dateformat')(number, format, true),
      theme: getTheme()
    }
    const actual = renderer.render(<DateModalIos {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
