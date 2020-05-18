// @flow

import { connect } from 'react-redux'

import { selectWalletForExchange } from '../../actions/CryptoExchangeActions.js'
import { parseScannedUri, qrCodeScanned } from '../../actions/ScanActions'
import Scan from '../../components/scenes/ScanScene'
import { getSelectedCurrencyCode, getSelectedWalletId } from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'

const mapStateToProps = (state: State) => ({
  cameraPermission: state.permissions.camera,
  torchEnabled: state.ui.scenes.scan.torchEnabled,
  scanEnabled: state.ui.scenes.scan.scanEnabled,
  currentWalletId: state.ui.scenes.transactionList.currentWalletId,
  currentCurrencyCode: state.ui.scenes.transactionList.currentCurrencyCode,
  walletId: getSelectedWalletId(state),
  currencyCode: getSelectedCurrencyCode(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  qrCodeScanned: data => dispatch(qrCodeScanned(data)),
  parseScannedUri: data => dispatch(parseScannedUri(data)),
  toggleEnableTorch: () => dispatch({ type: 'TOGGLE_ENABLE_TORCH' }),
  selectFromWalletForExchange: (walletId, currencyCode) => dispatch(selectWalletForExchange(walletId, currencyCode, 'from'))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Scan)
