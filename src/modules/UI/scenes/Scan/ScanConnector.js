// @flow

import type { AbcCurrencyWallet, AbcParsedUri } from 'edge-login'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { loginWithEdge } from '../../../../actions/EdgeLoginActions.js'
import * as Constants from '../../../../constants/indexConstants'
import { getCameraPermission } from '../../../../reducers/permissions/selectors'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import { toggleScanToWalletListModal } from '../../components/WalletListModal/action'
import * as UI_SELECTORS from '../../selectors.js'
import { updateLabel, updateParsedURI } from '../SendConfirmation/action.js'
import { toggleWalletListModal } from '../WalletTransferList/action'
import { disableScan, enableScan, toggleAddressModal, toggleEnableTorch } from './action'
import Scan from './Scan.ui'

const mapStateToProps = (state: State) => {
  const walletId: string = UI_SELECTORS.getSelectedWalletId(state)
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, walletId)

  return {
    cameraPermission: getCameraPermission(state),
    abcWallet,
    torchEnabled: state.ui.scenes.scan.torchEnabled,
    scanEnabled: state.ui.scenes.scan.scanEnabled,
    walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
    scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility,
    showToWalletModal: state.ui.scenes.scan.scanToWalletListModalVisibility
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatchEnableScan: () => dispatch(enableScan()),
  dispatchDisableScan: () => dispatch(disableScan()),
  toggleEnableTorch: () => dispatch(toggleEnableTorch()),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  toggleWalletListModal: () => dispatch(toggleWalletListModal()),
  updateParsedURI: (parsedURI: AbcParsedUri) => dispatch(updateParsedURI(parsedURI)),
  updateWalletTransfer: wallet => dispatch(updateLabel(wallet)),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()),
  loginWithEdge: (url: string) => {
    Actions[Constants.EDGE_LOGIN]()
    dispatch(loginWithEdge(url))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Scan)
