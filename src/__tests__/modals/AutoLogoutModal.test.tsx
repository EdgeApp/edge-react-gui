import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { AutoLogoutModal } from '../../components/modals/AutoLogoutModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('AutoLogoutModal', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <AutoLogoutModal bridge={fakeAirshipBridge} autoLogoutTimeInSeconds={11} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
