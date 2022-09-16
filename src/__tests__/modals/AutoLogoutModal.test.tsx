import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { AutoLogoutModal } from '../../components/modals/AutoLogoutModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AutoLogoutModal', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      autoLogoutTimeInSeconds: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<AutoLogoutModal {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
