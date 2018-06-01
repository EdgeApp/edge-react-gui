// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes.js'

import { deactivated } from './PrimaryModalActions.js'
import { PrimaryModal } from './PrimaryModal.ui.js'

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

export const PrimaryModalConnector = connect(mapStateToProps, mapDispatchToProps)(PrimaryModal)
export default PrimaryModalConnector
