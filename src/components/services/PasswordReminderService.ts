import * as React from 'react'

import { setPasswordReminder } from '../../actions/LocalSettingsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import {
  initialState,
  type PasswordReminderState
} from '../../reducers/PasswordReminderReducer'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { matchJson } from '../../util/matchJson'

interface Props {}

export const PasswordReminderService: React.FC<Props> = props => {
  const settingsLoaded =
    useSelector(state => state.ui.settings.settingsLoaded) ?? false
  const passwordReminder = useSelector(state => state.ui.passwordReminder)
  const lastPasswordReminder = React.useRef<PasswordReminderState>(initialState)
  const dispatch = useDispatch()

  useAsyncEffect(
    async () => {
      if (
        settingsLoaded &&
        !matchJson(passwordReminder, lastPasswordReminder.current)
      ) {
        lastPasswordReminder.current = passwordReminder
        await dispatch(setPasswordReminder(passwordReminder))
      }
    },
    [settingsLoaded, passwordReminder],
    'PasswordReminderService'
  )

  return null
}
