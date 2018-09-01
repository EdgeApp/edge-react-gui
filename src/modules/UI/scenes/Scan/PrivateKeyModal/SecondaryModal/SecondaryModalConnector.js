// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes.js'
import { SecondaryModal } from './SecondaryModal.ui.js'
import { deactivated } from './SecondaryModalActions.js'

export const mapStateToProps = (state: State) => ({
  error: state.ui.scenes.scan.privateKeyModal.error,
  isSweeping: state.ui.scenes.scan.privateKeyModal.isSweeping,
  isActive: state.ui.scenes.scan.privateKeyModal.secondaryModal.isActive
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onBackButtonPress: () => {
    dispatch(deactivated())
  },
  onBackdropPress: () => {
    dispatch(deactivated())
  }
})

export const SecondaryModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(SecondaryModal)
export default SecondaryModalConnector
