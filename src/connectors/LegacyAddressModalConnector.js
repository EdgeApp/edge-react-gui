// @flow

import { connect } from 'react-redux'

import { deactivated } from '../actions/LegacyAddressModalActions.js'
import { LegacyAddressModal } from '../components/modals/LegacyAddressModal.js'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

export const mapStateToProps = (state: State) => ({
  isActive: state.ui.scenes.scan.legacyAddressModal.isActive
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  backButtonPressed: () => {
    dispatch(deactivated())
  },
  backdropPressed: () => {
    dispatch(deactivated())
  }
})

export const LegacyAddressModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(LegacyAddressModal)
export default LegacyAddressModalConnector
