// @flow
import {connect} from 'react-redux'
import WalletListModalBody from './WalletListModalBody.ui'
import {
  toggleScanToWalletListModal,
  disableWalletListModalVisibility
} from '../action'
import * as UI_ACTIONS from '../../../Wallets/action.js'
import {getTransactionsRequest} from '../../../../UI/scenes/TransactionList/action.js'
import * as UI_SELECTORS from '../../../selectors'
import * as SETTINGS_SELECTORS from '../../../Settings/selectors'
import {updateReceiveAddress} from '../../../scenes/Request/action.js'
import type {
  State,
  Dispatch
} from '../../../../ReduxTypes'

const mapStateToProps = (state: State): {} => ({
  walletList: UI_SELECTORS.getWallets(state),
  activeWalletIds: UI_SELECTORS.getActiveWalletIds(state),
  selectedWalletId: UI_SELECTORS.getSelectedWalletId(state),
  settings: SETTINGS_SELECTORS.getSettings(state)
})

const mapDispatchToProps = (dispatch: Dispatch): {} => ({
  selectWallet: (walletId, currencyCode) => dispatch(UI_ACTIONS.selectWallet(walletId, currencyCode)),
  getTransactions: (walletId, currencyCode) => dispatch(getTransactionsRequest(walletId, currencyCode)),
  disableWalletListModalVisibility: () => dispatch(disableWalletListModalVisibility()),
  toggleSelectedWalletListModal: () => dispatch(toggleScanToWalletListModal()),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()),
  updateReceiveAddress: (walletId, currencyCode) => dispatch(updateReceiveAddress(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListModalBody)
