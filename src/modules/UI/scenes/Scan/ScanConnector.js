// @flow

import { connect } from 'react-redux'

import Scan from './Scan.ui'
import type { Dispatch, State } from '../../../ReduxTypes'
import { getCameraPermission } from '../../../../reducers/permissions/selectors'
import { toggleScanToWalletListModal } from '../../components/WalletListModal/action'
import { toggleAddressModal, toggleEnableTorch, parseUri } from './action'

const mapStateToProps = (state: State) => ({
  cameraPermission: getCameraPermission(state),
  torchEnabled: state.ui.scenes.scan.torchEnabled,
  scanEnabled: state.ui.scenes.scan.scanEnabled
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  parseUri: data => dispatch(parseUri(data)),
  toggleEnableTorch: () => dispatch(toggleEnableTorch()),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(Scan)
