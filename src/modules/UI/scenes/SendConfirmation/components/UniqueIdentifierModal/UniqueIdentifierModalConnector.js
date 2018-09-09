// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes.js'
import { UniqueIdentifierModal } from './UniqueIdentifierModal.ui.js'
import { deactivated, reset, uniqueIdentifierChanged } from './UniqueIdentifierModalActions.js'

export const mapStateToProps = (state: State) => ({
  isActive: state.ui.scenes.uniqueIdentifierModal.isActive,
  uniqueIdentifier: state.ui.scenes.uniqueIdentifierModal.uniqueIdentifier || state.ui.scenes.sendConfirmation.parsedUri.uniqueIdentifier
})
export const mapDispatchToProps = (dispatch: Dispatch, ownProps: Object) => ({
  uniqueIdentifierChanged: (uniqueIdentifier: string) => dispatch(uniqueIdentifierChanged(uniqueIdentifier)),
  onConfirm: (uniqueIdentifier: string) => {
    dispatch(deactivated())
    ownProps.onConfirm(uniqueIdentifier)
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
