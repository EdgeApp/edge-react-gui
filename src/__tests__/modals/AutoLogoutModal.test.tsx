import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { AutoLogoutModal } from '../../components/modals/AutoLogoutModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AutoLogoutModal', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(<AutoLogoutModal bridge={fakeAirshipBridge} autoLogoutTimeInSeconds={11} />)

    expect(actual).toMatchSnapshot()
  })
})
