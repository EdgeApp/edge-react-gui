import * as React from 'react'

import { setPasswordReminder } from '../../actions/LocalSettingsActions'
import { connect } from '../../types/reactRedux'
import { PasswordReminder } from '../../types/types'
import { matchJson } from '../../util/matchJson'

interface StateProps {
  settingsLoaded: boolean | null
  passwordReminder: PasswordReminder
}
interface DispatchProps {
  setPasswordReminder: (passwordReminder: PasswordReminder) => void
}
type Props = StateProps & DispatchProps

class PasswordReminderComponent extends React.PureComponent<Props> {
  componentDidUpdate(prevProps: Props) {
    if (this.props.settingsLoaded && !matchJson(prevProps.passwordReminder, this.props.passwordReminder)) {
      this.props.setPasswordReminder(this.props.passwordReminder)
    }
  }

  render() {
    return null
  }
}

export const PasswordReminderService = connect<StateProps, DispatchProps, {}>(
  state => ({
    settingsLoaded: state.ui.settings.settingsLoaded,
    passwordReminder: state.ui.passwordReminder
  }),
  dispatch => ({
    setPasswordReminder(passwordReminder: PasswordReminder) {
      dispatch(setPasswordReminder(passwordReminder))
    }
  })
)(PasswordReminderComponent)
