// @flow

import { connect } from 'react-redux'

import { onPrivateKeyAccept, onPrivateKeyReject, sweepPrivateKeyReset } from '../actions/PrivateKeyModalActions.js'
import { PrivateKeyModal } from '../components/modals/PrivateKeyModal.js'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

export const mapStateToProps = (state: State) => ({})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onPrivateKeyAccept: () => {
    dispatch(onPrivateKeyAccept())
  },
  onPrivateKeyReject: () => {
    dispatch(onPrivateKeyReject())
  },
  reset: () => {
    dispatch(sweepPrivateKeyReset())
  }
})

export const PrivateKeyModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(PrivateKeyModal)
export default PrivateKeyModalConnector
