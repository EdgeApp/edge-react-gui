// @flow

import { connect } from 'react-redux'
import type { AbcParsedUri, AbcCurrencyWallet } from 'edge-login'
import { Actions } from 'react-native-router-flux'

import Scan from './Scan.ui'
import * as Constants from '../../../../constants/indexConstants'
import {getSelectedWalletId} from '../../selectors.js'
import {getWallet} from '../../../Core/selectors.js'

import { toggleScanToWalletListModal } from '../../components/WalletListModal/action'
import { loginWithEdge } from '../../../../actions/indexActions'
import { toggleEnableTorch, toggleAddressModal, disableScan, enableScan } from './action'
import { updateParsedURI, updateLabel } from '../SendConfirmation/action.js'

import { toggleWalletListModal } from '../WalletTransferList/action'

import type { Dispatch, State } from '../../../ReduxTypes'
import {getCameraPermission} from '../../../../reducers/permissions/selectors'

import {getIsWalletTransferModalVisible} from '../WalletTransferList/selectors'
import {
  getIsScanToWalletListModalVisibile,
  getIsTorchEnabled,
  getIsScanEnabled
} from './selectors'

const mapStateToProps = (state: State) => {
  const walletId: string = getSelectedWalletId(state)
  const abcWallet: AbcCurrencyWallet = getWallet(state, walletId)

  return {
    cameraPermission: getCameraPermission(state),
    abcWallet,
    torchEnabled: getIsTorchEnabled(state),
    scanEnabled: getIsScanEnabled(state),
    walletListModalVisible: getIsWalletTransferModalVisible(state),
    scanToWalletListModalVisibility: getIsScanToWalletListModalVisibile(state),
    showToWalletModal: getIsScanToWalletListModalVisibile(state)
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
