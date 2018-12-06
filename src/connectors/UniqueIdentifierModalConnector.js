// @flow

import { connect } from 'react-redux'

import { deactivated, reset, uniqueIdentifierChanged } from '../actions/UniqueIdentifierModalActions.js'
import { UniqueIdentifierModal } from '../components/modals/UniqueIdentifierModal.js'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

export const mapStateToProps = (state: State) => {
  let uniqueIdentifier = state.ui.scenes.uniqueIdentifierModal.uniqueIdentifier
  if (uniqueIdentifier === undefined) {
    uniqueIdentifier = state.ui.scenes.sendConfirmation.guiMakeSpendInfo.uniqueIdentifier
  }
  return {
    isActive: state.ui.scenes.uniqueIdentifierModal.isActive,
    uniqueIdentifier
  }
}

export const mapDispatchToProps = (dispatch: Dispatch, ownProps: Object) => ({
  uniqueIdentifierChanged: (uniqueIdentifier: string) => dispatch(uniqueIdentifierChanged(uniqueIdentifier)),
  onConfirm: (uniqueIdentifier: string) => {
    dispatch(deactivated())
    ownProps.onConfirm({ uniqueIdentifier })
  },
  onCancel: () => dispatch(deactivated()),
  onBackdropPress: () => dispatch(deactivated()),
  onBackbuttonPress: () => dispatch(deactivated()),
  onModalHide: () => dispatch(reset())
})

export const UniqueIdentifierModalConnect = connect(
  mapStateToProps,
  mapDispatchToProps
)(UniqueIdentifierModal)
export default UniqueIdentifierModalConnect
