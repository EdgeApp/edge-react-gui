import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { AirshipFullScreenSpinner } from '../../components/modals/AirshipFullScreenSpinner'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AirshipFullScreenSpinner', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <AirshipFullScreenSpinner
        bridge={fakeAirshipBridge}
        // The message to show in the toast:
        message="string"
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
