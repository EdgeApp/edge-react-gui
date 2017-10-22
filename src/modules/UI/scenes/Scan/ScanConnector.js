// @flow
import {connect} from 'react-redux'
import Scan from './Scan.ui'
import * as Constants from '../../../../constants/indexConstants'
import * as UI_SELECTORS from '../../selectors.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'

import {toggleScanToWalletListModal} from '../../components/WalletListModal/action'
import {loginWithEdge} from '../../../../actions/indexActions'
import type {AbcParsedUri, AbcCurrencyWallet} from 'airbitz-core-types'
import {toggleEnableTorch, toggleAddressModal, disableScan, enableScan} from './action'
import {
  updateParsedURI,
  updateWalletTransfer
} from '../SendConfirmation/action.js'
import {Actions} from 'react-native-router-flux'

import {toggleWalletListModal} from '../WalletTransferList/action'

const mapStateToProps = (state: any) => {
  const walletId: string = UI_SELECTORS.getSelectedWalletId(state)
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, walletId)
  const sceneName:? string = state.routes.scene.children
    ? state.routes.scene.children[state.routes.scene.index].name
    : null

  return {
    abcWallet,
    sceneName,
    torchEnabled: state.ui.scenes.scan.torchEnabled,
    scanEnabled: state.ui.scenes.scan.scanEnabled,
    walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
    scanFromWalletListModalVisibility: state.ui.scenes.scan.scanFromWalletListModalVisibility,
    scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  dispatchEnableScan: () => dispatch(enableScan()),
  dispatchDisableScan: () => dispatch(disableScan()),
  toggleEnableTorch: () => dispatch(toggleEnableTorch()),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  toggleWalletListModal: () => dispatch(toggleWalletListModal()),
  updateParsedURI: (parsedURI: AbcParsedUri) => dispatch(updateParsedURI(parsedURI)),
  updateWalletTransfer: (wallet) => dispatch(updateWalletTransfer(wallet)),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()),
  loginWithEdge: (url: string) => {
    Actions[Constants.EDGE_LOGIN](),
    dispatch(loginWithEdge(url))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Scan)
