// @flow

import * as React from 'react'
import { connect } from 'react-redux'

import { setPasswordReminder } from '../../actions/PasswordReminderActions.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { PasswordReminder } from '../../types/types.js'
import { matchJson } from '../../util/matchJson.js'

type StateProps = {
  loginStatus: boolean | null,
  passwordReminder: PasswordReminder
}
type DispatchProps = {
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

export const PasswordReminderService = connect(
  (state: RootState): StateProps => ({
    loginStatus: state.ui.settings.loginStatus,
    passwordReminder: state.ui.passwordReminder
  }),
  (dispatch: Dispatch): DispatchProps => ({
    setPasswordReminder(passwordReminder: PasswordReminder) {
      dispatch(setPasswordReminder(passwordReminder))
    }
  })
)(PasswordReminderComponent)
