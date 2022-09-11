/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { HelpModalComponent } from '../../components/modals/HelpModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('HelpModal', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      theme: getTheme()
    }
    const actual = renderer.render(<HelpModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
