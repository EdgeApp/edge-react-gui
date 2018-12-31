// @flow

import { connect } from 'react-redux'

import { parseScannedUri, qrCodeScanned, toggleAddressModal } from '../../actions/ScanActions'
import { selectWalletFromModal } from '../../actions/WalletActions.js'
import Scan from '../../components/scenes/ScanScene'
import { getCameraPermission } from '../../modules/permissions/PermissionsSelectors'
import type { Dispatch, State } from '../../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({
  cameraPermission: getCameraPermission(state),
  torchEnabled: state.ui.scenes.scan.torchEnabled,
  scanEnabled: state.ui.scenes.scan.scanEnabled,
  showToWalletModal: state.ui.scenes.walletListModal.walletListModalVisible,
  deepLinkPending: state.core.deepLinking.deepLinkPending,
  deepLinkUri: state.core.deepLinking.addressDeepLinkData.uri
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  qrCodeScanned: data => dispatch(qrCodeScanned(data)),
  parseScannedUri: data => dispatch(parseScannedUri(data)),
  toggleEnableTorch: () => dispatch({ type: 'TOGGLE_ENABLE_TORCH' }),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  onSelectWallet: (walletId: string, currencyCode: string) => dispatch(selectWalletFromModal(walletId, currencyCode)),
  markAddressDeepLinkDone: () =>
    dispatch({
      type: 'ADDRESS_DEEP_LINK_COMPLETE'
    })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Scan)
