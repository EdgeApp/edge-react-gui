// @flow
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes.js'
import { PasswordRecoveryModalComponent } from './PasswordRecoveryModal.ui.js'
import { hidePasswordRecoveryModal, onGoToPasswordRecoveryScene } from './PasswordRecoveryModalActions.js'

export const mapStateToProps = (state: State) => ({
  isVisible: state.ui.scenes.passwordRecoveryModal.isVisible
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  hidePasswordRecoveryModal: () => dispatch(hidePasswordRecoveryModal()),
  onGoToPasswordRecoveryScene: () => dispatch(onGoToPasswordRecoveryScene())
})

export const PasswordRecoveryModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(PasswordRecoveryModalComponent)
