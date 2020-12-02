// @flow

import { connect } from 'react-redux'

import { SecondaryModal } from '../components/modals/SecondaryModal.js'
import { type Dispatch, type RootState } from '../types/reduxTypes.js'

const mapStateToProps = (state: RootState) => ({
  error: state.ui.scenes.scan.privateKeyModal.error,
  isSweeping: state.ui.scenes.scan.privateKeyModal.isSweeping,
  isActive: state.ui.scenes.scan.privateKeyModal.secondaryModal.isActive
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onBackButtonPress: () => {
    dispatch({ type: 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/DEACTIVATED' })
  },
  onBackdropPress: () => {
    dispatch({ type: 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/DEACTIVATED' })
  }
})

export const SecondaryModalConnector = connect(mapStateToProps, mapDispatchToProps)(SecondaryModal)
export default SecondaryModalConnector
