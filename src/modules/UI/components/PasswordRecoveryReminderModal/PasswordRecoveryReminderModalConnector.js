// @flow
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../types/reduxTypes.js'
import { PasswordRecoveryReminderModalComponent } from './PasswordRecoveryReminderModal.ui.js'
import { hidePasswordRecoveryReminderModal, onGoToPasswordRecoveryScene } from './PasswordRecoveryReminderModalActions.js'

export const mapStateToProps = (state: State) => ({
  isVisible: state.ui.scenes.passwordRecoveryReminderModal.isVisible
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  hidePasswordRecoveryReminderModal: () => dispatch(hidePasswordRecoveryReminderModal()),
  onGoToPasswordRecoveryScene: () => dispatch(onGoToPasswordRecoveryScene())
})

export const PasswordRecoveryReminderModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(PasswordRecoveryReminderModalComponent)
