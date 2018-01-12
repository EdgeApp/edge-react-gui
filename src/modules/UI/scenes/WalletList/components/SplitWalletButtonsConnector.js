// @flow
import {connect} from 'react-redux'
import SplitWalletButtons from './SplitWalletButtons.ui'
import {closeSplitWalletModal, splitWallet} from '../action'

const mapStateToProps = (state: State): StateToProps => ({
  walletId: state.ui.scenes.walletList.walletId
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onNegative: () => {},
  onPositive: (walletId) => dispatch(splitWallet(walletId)),
  onDone: () => dispatch(closeSplitWalletModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(SplitWalletButtons)
