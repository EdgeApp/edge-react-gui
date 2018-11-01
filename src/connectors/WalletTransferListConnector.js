// @flow

import { connect } from 'react-redux'

import { toggleWalletListModal } from '../actions/WalleTransferListActions'
import WalletTransferList from '../components/common/WalletTransferList'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

const mapStateToProps = (state: State) => ({
  walletTransferList: state.ui.scenes.walletTransferList.walletTransferList,
  walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleWalletListModal: () => dispatch(toggleWalletListModal())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletTransferList)
