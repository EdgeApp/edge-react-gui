// @flow

import { connect } from 'react-redux'

import * as actions from '../../../../../actions/indexActions'
import * as Constants from '../../../../../constants/indexConstants'
import type { Dispatch, State } from '../../../../ReduxTypes'
import { updateReceiveAddress } from '../../../scenes/Request/action.js'
import * as UI_SELECTORS from '../../../selectors'
import * as SETTINGS_SELECTORS from '../../../Settings/selectors'
import * as UI_ACTIONS from '../../../Wallets/action.js'
import { disableWalletListModalVisibility, toggleScanToWalletListModal } from '../action'
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
  disableWalletListModalVisibility: () => dispatch(disableWalletListModalVisibility()),
  toggleSelectedWalletListModal: () => dispatch(toggleScanToWalletListModal()),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()),
  updateReceiveAddress: (walletId, currencyCode) => dispatch(updateReceiveAddress(walletId, currencyCode))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletListModalBody)
