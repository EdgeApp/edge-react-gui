import * as React from 'react'

import { setPasswordReminder } from '../../actions/PasswordReminderActions'
import { connect } from '../../types/reactRedux'
import { PasswordReminder } from '../../types/types'
import { matchJson } from '../../util/matchJson'

interface StateProps {
  loginStatus: boolean | null
  passwordReminder: PasswordReminder
}
interface DispatchProps {
  setPasswordReminder: (passwordReminder: PasswordReminder) => void
}
type Props = StateProps & DispatchProps

class PasswordReminderComponent extends React.PureComponent<Props> {
  componentDidUpdate(prevProps: Props) {
    if (this.props.loginStatus && !matchJson(prevProps.passwordReminder, this.props.passwordReminder)) {
      this.props.setPasswordReminder(this.props.passwordReminder)
    }
  }

  render() {
    return null
  }
}

export const PasswordReminderService = connect<StateProps, DispatchProps, {}>(
  state => ({
    loginStatus: state.ui.settings.loginStatus,
    passwordReminder: state.ui.passwordReminder
  }),
  dispatch => ({
    setPasswordReminder(passwordReminder: PasswordReminder) {
      dispatch(setPasswordReminder(passwordReminder))
    }
  })
)(PasswordReminderComponent)
