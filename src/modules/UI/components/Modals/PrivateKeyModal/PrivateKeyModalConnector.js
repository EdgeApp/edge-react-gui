// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../ReduxTypes.js'

import { sweepPrivateKey, dismissModal, reset } from './indexPrivateKeyModal.js'
import PrivateKeyModalComponent from './PrivateKeyModal.ui.js'

export const mapStateToProps = (state: State) => ({
  ...state.ui.privateKeyModal
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSweep: () => {
    dispatch(sweepPrivateKey())
  },
  onCancel: () => {
    dispatch(dismissModal())
  },
  reset: () => {
    dispatch(reset())
  }
})

export const PrivateKeyModal = connect(mapStateToProps, mapDispatchToProps)(PrivateKeyModalComponent)
