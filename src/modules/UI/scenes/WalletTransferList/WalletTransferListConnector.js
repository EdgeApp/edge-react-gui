import { connect } from 'react-redux'

import { toggleWalletListModal } from './action'
import WalletTransferList from './WalletTransferList.ui'

const mapStateToProps = state => ({
  walletTransferList: state.ui.scenes.walletTransferList.walletTransferList,
  walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible
})

const mapDispatchToProps = dispatch => ({
  toggleWalletListModal: () => dispatch(toggleWalletListModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletTransferList)
