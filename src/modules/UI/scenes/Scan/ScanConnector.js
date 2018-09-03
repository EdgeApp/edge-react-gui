// @flow

import { connect } from 'react-redux'

import { getCameraPermission } from '../../../../reducers/permissions/selectors'
import type { Dispatch, State } from '../../../ReduxTypes'
import { selectWalletFromModal } from '../../Wallets/action.js'
import {
  addressModalCancelButtonPressed,
  addressModalDoneButtonPressed,
  legacyAddressModalCancelButtonPressed,
  legacyAddressModalContinueButtonPressed,
  qrCodeScanned,
  toggleAddressModal,
  toggleEnableTorch
} from './action'
import Scan from './Scan.ui'

const mapStateToProps = (state: State) => ({
  cameraPermission: getCameraPermission(state),
  torchEnabled: state.ui.scenes.scan.torchEnabled,
  scanEnabled: state.ui.scenes.scan.scanEnabled,
  showToWalletModal: state.ui.scenes.walletListModal.walletListModalVisible
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  qrCodeScanned: data => dispatch(qrCodeScanned(data)),
  toggleEnableTorch: () => dispatch(toggleEnableTorch()),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  legacyAddressModalContinueButtonPressed: () => dispatch(legacyAddressModalContinueButtonPressed()),
  legacyAddressModalCancelButtonPressed: () => dispatch(legacyAddressModalCancelButtonPressed()),
  addressModalDoneButtonPressed: data => dispatch(addressModalDoneButtonPressed(data)),
  addressModalCancelButtonPressed: () => dispatch(addressModalCancelButtonPressed()),
  onSelectWallet: (walletId: string, currencyCode: string) => dispatch(selectWalletFromModal(walletId, currencyCode))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Scan)
