/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { HelpModalComponent } from '../../components/modals/HelpModal'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('HelpModal', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      generateTestHook: () => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<HelpModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
