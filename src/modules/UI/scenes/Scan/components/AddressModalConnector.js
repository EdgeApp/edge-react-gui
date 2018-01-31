// @flow

import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import type {AbcParsedUri, AbcCurrencyWallet} from 'edge-login'

import AddressModal from './AddressModal'
import {toggleAddressModal} from '../action'
import {getSelectedWalletId, getSelectedCurrencyCode} from '../../../selectors.js'
import {getWallet} from '../../../../Core/selectors.js'
import {updateParsedURI} from '../../SendConfirmation/action.js'
import {loginWithEdge} from '../../../../../actions/indexActions'
import * as Constants from '../../../../../constants/indexConstants'
import type {Dispatch, State} from '../../../../ReduxTypes'
import {getAddressModalVisible} from '../selectors.js'

const mapStateToProps = (state: State) => {
  const walletId:string = getSelectedWalletId(state)
  const coreWallet: AbcCurrencyWallet = getWallet(state, walletId)
  const currencyCode:string = getSelectedCurrencyCode(state)

  return {
    coreWallet,
    currencyCode,
    addressModalVisible: getAddressModalVisible(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  updateParsedURI: (parsedURI: AbcParsedUri) => dispatch(updateParsedURI(parsedURI)),
  loginWithEdge: (url: string) => {
    Actions[Constants.EDGE_LOGIN]()
    dispatch(loginWithEdge(url))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(AddressModal)
