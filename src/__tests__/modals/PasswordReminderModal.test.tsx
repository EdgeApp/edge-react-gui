import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { PasswordReminderModalComponent } from '../../components/modals/PasswordReminderModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { fakeUser } from '../../util/fake-user'

describe('PasswordReminderModal', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
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
    const actual = renderer.render(<PasswordReminderModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
