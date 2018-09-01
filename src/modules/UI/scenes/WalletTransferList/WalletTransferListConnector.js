// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes.js'
import { toggleWalletListModal } from './action'
import WalletTransferList from './WalletTransferList.ui'

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
