// @flow

import {connect} from 'react-redux'

import DeleteWalletButtons from './DeleteWalletButtons.ui'
import * as Constants from '../../../../../constants/indexConstants'
import {CLOSE_MODAL_VALUE, deleteWallet} from './WalletOptions/action'

import type {Dispatch} from '../../../../ReduxTypes'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onNegative: () => {},
  onPositive: (walletId) => dispatch(deleteWallet(walletId)),
  onDone: () => dispatch({type: CLOSE_MODAL_VALUE(Constants.WALLET_OPTIONS.DELETE.value)})
})

export default connect(mapStateToProps, mapDispatchToProps)(DeleteWalletButtons)
