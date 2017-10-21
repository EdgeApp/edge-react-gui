import {connect} from 'react-redux'
import Scan from './Scan.ui'

import * as UI_SELECTORS from '../../selectors.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'

import {toggleScanToWalletListModal} from '../../components/WalletListModal/action'
import {toggleEnableTorch, toggleAddressModal} from './action'

import {
  updateParsedURI,
  updatePublicAddressRequest,
  updateWalletTransfer
} from '../SendConfirmation/action.js'

import {toggleWalletListModal} from '../WalletTransferList/action'

const mapStateToProps = (state) => {
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, walletId)
  const sceneName = state.routes.scene.children
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

const mapDispatchToProps = (dispatch) => ({
  toggleEnableTorch: () => dispatch(toggleEnableTorch()),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  toggleWalletListModal: () => dispatch(toggleWalletListModal()),
  updateParsedURI: (parsedURI) => dispatch(updateParsedURI(parsedURI)),
  updatePublicAddress: (publicAddress) => dispatch(updatePublicAddressRequest(publicAddress)),
  updateWalletTransfer: (wallet) => dispatch(updateWalletTransfer(wallet)),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(Scan)
