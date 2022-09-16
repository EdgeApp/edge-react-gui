import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { HelpModalComponent } from '../../components/modals/HelpModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('HelpModal', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      theme: getTheme()
    }
    const actual = renderer.render(<HelpModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
