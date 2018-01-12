// @flow
import {connect} from 'react-redux'
import ResyncWalletButtons from './ResyncWalletButtons.ui'
import {closeResyncWalletModal, resyncWallet} from '../action'

const mapStateToProps = (state: State): StateToProps => ({
  walletId: state.ui.scenes.walletList.walletId
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (walletId) => dispatch(resyncWallet(walletId)),
  onDone: () => dispatch(closeResyncWalletModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(ResyncWalletButtons)
