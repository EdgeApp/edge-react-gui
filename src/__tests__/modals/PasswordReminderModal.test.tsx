import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { PasswordReminderModalComponent } from '../../components/modals/PasswordReminderModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('PasswordReminderModal', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeAccount: any = {}

    const actual = renderer.render(
      <PasswordReminderModalComponent
        navigation={fakeNavigation}
        bridge={fakeAirshipBridge}
        account={fakeAccount}
        onSuccess={() => undefined}
        onPostpone={() => undefined}
        onRequestChangePassword={() => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
