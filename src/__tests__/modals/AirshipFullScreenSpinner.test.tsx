import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { AirshipFullScreenSpinner } from '../../components/modals/AirshipFullScreenSpinner'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('AirshipFullScreenSpinner', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <AirshipFullScreenSpinner
          bridge={fakeAirshipBridge}
          // The message to show in the toast:
          message="string"
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
