// @flow

import {connect} from 'react-redux'

import WalletTransferList from './WalletTransferList.ui'
import {toggleWalletListModal} from './action'

import {
  getWalletTransferList,
  getIsWalletTransferModalVisible
} from './selectors'

import type {State, Dispatch} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  walletTransferList: getWalletTransferList(state),
  walletListModalVisible: getIsWalletTransferModalVisible(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleWalletListModal: () => dispatch(toggleWalletListModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletTransferList)
