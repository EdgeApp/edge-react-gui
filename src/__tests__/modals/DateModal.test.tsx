import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { DateModalIos } from '../../components/modals/DateModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('DateModalIos', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <DateModalIos
        bridge={fakeAirshipBridge}
        // Chancellor on brink of second bailout for banks:
        initialValue={new Date('2009-01-03T18:15:05.000Z')}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
