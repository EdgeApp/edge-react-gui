// @flow

import { connect } from 'react-redux'

import { deactivated } from '../actions/PrimaryModalActions.js'
import { PrimaryModal } from '../components/modals/PrimaryModal.js'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

export const mapStateToProps = (state: State) => ({
  isActive: state.ui.scenes.scan.privateKeyModal.primaryModal.isActive
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onReject: () => {
    dispatch(deactivated())
  },
  onBackButtonPress: () => {
    dispatch(deactivated())
  },
  onBackdropPress: () => {
    dispatch(deactivated())
  }
})

export const PrimaryModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(PrimaryModal)
export default PrimaryModalConnector
