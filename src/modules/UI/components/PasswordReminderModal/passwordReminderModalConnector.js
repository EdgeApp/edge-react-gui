// @flow

import { connect } from 'react-redux'

import { checkPassword, requestChangePassword, setPasswordReminder } from './indexPasswordReminderModal.js'
import {PasswordReminderModal} from './PasswordReminderModal.ui.js'
import { postponePasswordReminder } from '../../../../reducers/passwordReminder/indexPasswordReminder.js'

import type { State, Dispatch } from '../../../ReduxTypes.js'

export const mapStateToProps = (state: State) => ({
  loginStatus: state.ui.settings.loginStatus,
  status: state.ui.scenes.passwordReminderModal.status,
  isVisible: state.ui.passwordReminder.needsPasswordCheck,
  passwordReminder: state.ui.passwordReminder
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSubmit: (password: string) => dispatch(checkPassword(password)),
  onRequestChangePassword: () => dispatch(requestChangePassword()),
  onPostpone: () => dispatch(postponePasswordReminder()),
  setPasswordReminder: (passwordReminder: Object) => dispatch(setPasswordReminder(passwordReminder))
})

export const passwordReminderModalConnector = connect(mapStateToProps, mapDispatchToProps)(PasswordReminderModal)
