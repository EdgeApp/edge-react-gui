// @flow

import { connect } from 'react-redux'
import type { AbcParsedUri, AbcCurrencyWallet } from 'edge-login'
import { Actions } from 'react-native-router-flux'

import Scan from './Scan.ui'
import * as Constants from '../../../../constants/indexConstants'
import * as UI_SELECTORS from '../../selectors.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'

import { toggleScanToWalletListModal } from '../../components/WalletListModal/action'
import { loginWithEdge } from '../../../../actions/indexActions'
import { toggleEnableTorch, toggleAddressModal, disableScan, enableScan } from './action'
import { updateParsedURI, updateLabel } from '../SendConfirmation/action.js'

import { toggleWalletListModal } from '../WalletTransferList/action'

import type { Dispatch, State } from '../../../ReduxTypes'
import {getCameraPermission} from '../../../../reducers/permissions/selectors'

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
