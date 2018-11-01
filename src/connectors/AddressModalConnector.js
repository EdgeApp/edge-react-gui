// @flow

import type { EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { loginWithEdge } from '../actions/indexActions'
import { toggleAddressModal } from '../actions/ScanActions'
import { updateParsedURI } from '../actions/SendConfirmationActions.js'
import AddressModal from '../components/modals/AddressModal'
import * as Constants from '../constants/indexConstants'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import type { Dispatch, State } from '../modules/ReduxTypes'
import * as UI_SELECTORS from '../modules/UI/selectors.js'

const mapStateToProps = (state: State) => {
  const walletId: string = UI_SELECTORS.getSelectedWalletId(state)
  const coreWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, walletId)
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)

  return {
    coreWallet,
    currencyCode,
    addressModalVisible: state.ui.scenes.scan.addressModalVisible
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  updateParsedURI: (parsedURI: EdgeParsedUri) => dispatch(updateParsedURI(parsedURI)),
  loginWithEdge: (url: string) => {
    Actions[Constants.EDGE_LOGIN]()
    dispatch(loginWithEdge(url))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddressModal)
