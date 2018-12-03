// @flow

import { connect } from 'react-redux'

import { secondaryModalDeactivated } from '../actions/SecondaryModalActions.js'
import { SecondaryModal } from '../components/modals/SecondaryModal.js'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

export const mapStateToProps = (state: State) => ({
  error: state.ui.scenes.scan.privateKeyModal.error,
  isSweeping: state.ui.scenes.scan.privateKeyModal.isSweeping,
  isActive: state.ui.scenes.scan.privateKeyModal.secondaryModal.isActive
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onBackButtonPress: () => {
    dispatch(secondaryModalDeactivated())
  },
  onBackdropPress: () => {
    dispatch(secondaryModalDeactivated())
  }
})

export const SecondaryModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(SecondaryModal)
export default SecondaryModalConnector
