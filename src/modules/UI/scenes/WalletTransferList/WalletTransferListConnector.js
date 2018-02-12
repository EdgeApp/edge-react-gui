// @flow

import {connect} from 'react-redux'

import WalletTransferList from './WalletTransferList.ui'
import {toggleWalletListModal} from './action'
import type {State, Dispatch} from '../../../ReduxTypes.js'

const mapStateToProps = (state: State) => ({
  walletTransferList: state.ui.scenes.walletTransferList.walletTransferList,
  walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleWalletListModal: () => dispatch(toggleWalletListModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletTransferList)
