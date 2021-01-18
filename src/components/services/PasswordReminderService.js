// @flow

import * as React from 'react'
import { connect } from 'react-redux'

import { setPasswordReminder } from '../../actions/PasswordReminderActions.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { PasswordReminder } from '../../types/types.js'
import { matchJson } from '../../util/matchJson.js'

type Props = {
  setPasswordReminder: (passwordReminder: PasswordReminder) => void,
  passwordReminder: PasswordReminder,
  loginStatus: boolean | null
}

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
  (state: RootState) => ({
    loginStatus: state.ui.settings.loginStatus,
    passwordReminder: state.ui.passwordReminder
  }),
  (dispatch: Dispatch) => ({
    setPasswordReminder: (passwordReminder: PasswordReminder) => dispatch(setPasswordReminder(passwordReminder))
  })
)(PasswordReminderComponent)
