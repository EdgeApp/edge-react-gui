// @flow

import { connect } from 'react-redux'

import * as actions from '../../../../../actions/indexActions'
import { updateReceiveAddress } from '../../../../../actions/RequestActions.js'
import * as UI_ACTIONS from '../../../../../actions/WalletActions.js'
import * as Constants from '../../../../../constants/indexConstants'
import type { Dispatch, State } from '../../../../ReduxTypes'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import * as UI_SELECTORS from '../../../selectors'
import WalletListModalBody from './WalletListModalBody.ui'

const mapStateToProps = (state: State, ownProps: { type: string }): {} => ({
  type: ownProps.type,
  walletList: UI_SELECTORS.getWallets(state),
  activeWalletIds: UI_SELECTORS.getActiveWalletIds(state),
  selectedWalletId: UI_SELECTORS.getSelectedWalletId(state),
  settings: SETTINGS_SELECTORS.getSettings(state)
})

const mapDispatchToProps = (dispatch: Dispatch): {} => ({
  selectWallet: (walletId, currencyCode, type) => {
    if (type === Constants.TO || type === Constants.FROM) {
      dispatch(UI_ACTIONS.selectWallet(walletId, currencyCode))
      return
    }
    // $FlowFixMe
    dispatch(actions.selectWalletForExchange(walletId, currencyCode))
  },
  disableWalletListModalVisibility: () => dispatch({ type: 'DISABLE_WALLET_LIST_MODAL_VISIBILITY' }),
  toggleSelectedWalletListModal: () => dispatch({ type: 'TOGGLE_SCAN_TO_WALLET_LIST_MODAL' }),
  toggleScanToWalletListModal: () => dispatch({ type: 'TOGGLE_SCAN_TO_WALLET_LIST_MODAL' }),
  updateReceiveAddress: (walletId, currencyCode) => dispatch(updateReceiveAddress(walletId, currencyCode))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletListModalBody)
