import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { PasswordReminderModalComponent } from '../../components/modals/PasswordReminderModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('PasswordReminderModal', () => {
  it('should render with loading props', () => {
    const fakeAccount: any = {}
    const fakeDispatch: any = () => {}

    const rendered = render(
      <FakeProviders>
        <PasswordReminderModalComponent
          account={fakeAccount}
          bridge={fakeAirshipBridge}
          dispatch={fakeDispatch}
          navigation={fakeNavigation}
          theme={getTheme()}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
