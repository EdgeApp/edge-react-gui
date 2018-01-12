import {connect} from 'react-redux'
import DeleteWalletButtons from './DeleteWalletButtons.ui'
import {CLOSE_DELETE_WALLET_MODAL, deleteWallet} from '../action'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch) => ({
  onNegative: () => {},
  onPositive: (walletId) => dispatch(deleteWallet(walletId)),
  onDone: () => dispatch({type: CLOSE_DELETE_WALLET_MODAL})
})

export default connect(mapStateToProps, mapDispatchToProps)(DeleteWalletButtons)
