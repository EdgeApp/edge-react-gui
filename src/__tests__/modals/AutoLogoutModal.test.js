/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { AutoLogoutModal } from '../../components/modals/AutoLogoutModal.js'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('AutoLogoutModal', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      autoLogoutTimeInSeconds: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<AutoLogoutModal {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
