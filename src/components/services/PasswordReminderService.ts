import * as React from 'react'

import { setPasswordReminder } from '../../actions/LocalSettingsActions'
import { connect } from '../../types/reactRedux'
import type { PasswordReminder } from '../../types/types'
import { matchJson } from '../../util/matchJson'
import { showError } from './AirshipInstance'

interface StateProps {
  settingsLoaded: boolean | null
  passwordReminder: PasswordReminder
}
interface DispatchProps {
  setPasswordReminder: (passwordReminder: PasswordReminder) => Promise<void>
}
type Props = StateProps & DispatchProps

class PasswordReminderComponent extends React.PureComponent<Props> {
  componentDidUpdate(prevProps: Props) {
    if (
      this.props.settingsLoaded &&
      !matchJson(prevProps.passwordReminder, this.props.passwordReminder)
    ) {
      this.props
        .setPasswordReminder(this.props.passwordReminder)
        .catch((error: unknown) => {
          showError(error)
        })
    }
  }

  render() {
    return null
  }
}

export const PasswordReminderService = connect<
  StateProps,
  DispatchProps,
  unknown
>(
  state => ({
    settingsLoaded: state.ui.settings.settingsLoaded,
    passwordReminder: state.ui.passwordReminder
  }),
  dispatch => ({
    async setPasswordReminder(passwordReminder: PasswordReminder) {
      await dispatch(setPasswordReminder(passwordReminder))
    }
  })
)(PasswordReminderComponent)
