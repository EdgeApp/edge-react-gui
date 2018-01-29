// @flow
import {connect} from 'react-redux'
import AddressModal from './AddressModal'
import {toggleAddressModal} from '../action'
import * as UI_SELECTORS from '../../../selectors.js'
import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import {updateParsedURI} from '../../SendConfirmation/action.js'
import {loginWithEdge} from '../../../../../actions/indexActions'
import type {AbcParsedUri, AbcCurrencyWallet} from 'edge-login'
import {Actions} from 'react-native-router-flux'
import * as Constants from '../../../../../constants/indexConstants'
const mapStateToProps = (state: any) => {
  const walletId:string = UI_SELECTORS.getSelectedWalletId(state)
  const coreWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, walletId)
  const currencyCode:string = UI_SELECTORS.getSelectedCurrencyCode(state)

  return {
    coreWallet,
    currencyCode,
    addressModalVisible: state.ui.scenes.scan.addressModalVisible
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  updateParsedURI: (parsedURI: AbcParsedUri) => dispatch(updateParsedURI(parsedURI)),
  loginWithEdge: (url: string) => {
    Actions[Constants.EDGE_LOGIN]()
    dispatch(loginWithEdge(url))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(AddressModal)
