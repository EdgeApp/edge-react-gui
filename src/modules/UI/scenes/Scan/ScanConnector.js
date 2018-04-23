// @flow

import { connect } from 'react-redux'

import Scan from './Scan.ui'
import type { Dispatch, State } from '../../../ReduxTypes'
import { getCameraPermission } from '../../../../reducers/permissions/selectors'
import { toggleScanToWalletListModal } from '../../components/WalletListModal/action'
import {
  toggleAddressModal,
  toggleEnableTorch,
  qrCodeScanned,
  legacyAddressModalContinueButtonPressed,
  legacyAddressModalCancelButtonPressed,
  addressModalDoneButtonPressed,
  addressModalCancelButtonPressed
} from './action'

const mapStateToProps = (state: State) => ({
  cameraPermission: getCameraPermission(state),
  torchEnabled: state.ui.scenes.scan.torchEnabled,
  scanEnabled: state.ui.scenes.scan.scanEnabled,
  showToWalletModal: state.ui.scenes.scan.scanToWalletListModalVisibility
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  qrCodeScanned: data => dispatch(qrCodeScanned(data)),
  toggleEnableTorch: () => dispatch(toggleEnableTorch()),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()),
  legacyAddressModalContinueButtonPressed: () => dispatch(legacyAddressModalContinueButtonPressed()),
  legacyAddressModalCancelButtonPressed: () => dispatch(legacyAddressModalCancelButtonPressed()),
  addressModalDoneButtonPressed: data => dispatch(addressModalDoneButtonPressed(data)),
  addressModalCancelButtonPressed: () => dispatch(addressModalCancelButtonPressed())
})

export default connect(mapStateToProps, mapDispatchToProps)(Scan)
