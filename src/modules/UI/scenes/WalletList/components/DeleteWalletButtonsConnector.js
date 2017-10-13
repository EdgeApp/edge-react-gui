import {connect} from 'react-redux'
import DeleteWalletButtons from './DeleteWalletButtons.ui'
import {closeDeleteWalletModal, deleteWallet} from '../action'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch) => ({
  onNegative: () => {},
  onPositive: (walletId) => dispatch(deleteWallet(walletId)),
  onDone: () => dispatch(closeDeleteWalletModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(DeleteWalletButtons)
