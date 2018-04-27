// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../ReduxTypes.js'

import { deactivated } from './LegacyAddressModalActions.js'
import { LegacyAddressModal } from './LegacyAddressModal.ui.js'

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

export const LegacyAddressModalConnector = connect(mapStateToProps, mapDispatchToProps)(LegacyAddressModal)
export default LegacyAddressModalConnector
