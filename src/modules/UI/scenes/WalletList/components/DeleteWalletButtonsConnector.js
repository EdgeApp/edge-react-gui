// @flow

import {connect} from 'react-redux'

import DeleteWalletButtons from './DeleteWalletButtons.ui'
import {CLOSE_DELETE_WALLET_MODAL, deleteWallet} from '../action'

import type {Dispatch} from '../../../../ReduxTypes'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onNegative: () => {},
  onPositive: (walletId) => dispatch(deleteWallet(walletId)),
  onDone: () => dispatch({type: CLOSE_DELETE_WALLET_MODAL})
})

export default connect(mapStateToProps, mapDispatchToProps)(DeleteWalletButtons)
