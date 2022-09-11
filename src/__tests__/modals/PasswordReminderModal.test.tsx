/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { PasswordReminderModalComponent } from '../../components/modals/PasswordReminderModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { fakeUser } from '../../util/fake-user'

describe('PasswordReminderModal', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      account: () => fakeUser,
      onSuccess: () => undefined,
      onPostpone: () => undefined,
      onRequestChangePassword: () => undefined,
      password: {
        needsPasswordCheck: true,
        lastPasswordUseDate: 112120,
        passwordUseCount: 12,
        nonPasswordLoginsCount: 50,
        nonPasswordDaysLimit: 11,
        nonPasswordLoginsLimit: 11
      },
      spinning: true,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<PasswordReminderModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
