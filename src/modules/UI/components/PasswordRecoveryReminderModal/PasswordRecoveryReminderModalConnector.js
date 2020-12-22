// @flow
import { connect } from 'react-redux'

import { type Dispatch, type RootState } from '../../../../types/reduxTypes.js'
import { PasswordRecoveryReminderModalComponent } from './PasswordRecoveryReminderModal.ui.js'
import { hidePasswordRecoveryReminderModal, onGoToPasswordRecoveryScene } from './PasswordRecoveryReminderModalActions.js'

const mapStateToProps = (state: RootState) => ({
  isVisible: state.ui.scenes.passwordRecoveryReminderModal.isVisible
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  hidePasswordRecoveryReminderModal: () => dispatch(hidePasswordRecoveryReminderModal()),
  onGoToPasswordRecoveryScene: () => dispatch(onGoToPasswordRecoveryScene())
})

export const PasswordRecoveryReminderModalConnector = connect(mapStateToProps, mapDispatchToProps)(PasswordRecoveryReminderModalComponent)
