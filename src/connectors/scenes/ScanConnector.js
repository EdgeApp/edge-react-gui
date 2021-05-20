// @flow

import { connect } from 'react-redux'

import { selectWalletForExchange } from '../../actions/CryptoExchangeActions.js'
import { parseScannedUri, qrCodeScanned } from '../../actions/ScanActions'
import Scan from '../../components/scenes/ScanScene'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'

const mapStateToProps = (state: RootState) => ({
  cameraPermission: state.permissions.camera,
  torchEnabled: state.ui.scenes.scan.torchEnabled,
  scanEnabled: state.ui.scenes.scan.scanEnabled,
  currentWalletId: state.ui.scenes.transactionList.currentWalletId,
  currentCurrencyCode: state.ui.scenes.transactionList.currentCurrencyCode,
  walletId: state.ui.wallets.selectedWalletId,
  currencyCode: state.ui.wallets.selectedCurrencyCode
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  qrCodeScanned: data => dispatch(qrCodeScanned(data)),
  parseScannedUri: (data, customErrorTitle, customErrorDescription) => dispatch(parseScannedUri(data, customErrorTitle, customErrorDescription)),
  toggleEnableTorch: () => dispatch({ type: 'TOGGLE_ENABLE_TORCH' }),
  selectFromWalletForExchange: (walletId, currencyCode) => dispatch(selectWalletForExchange(walletId, currencyCode, 'from'))
})

export default connect(mapStateToProps, mapDispatchToProps)(Scan)
