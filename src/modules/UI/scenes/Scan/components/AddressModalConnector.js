import {connect} from 'react-redux'
import AddressModal from './AddressModal'
import {toggleAddressModal} from '../action'
import * as UI_SELECTORS from '../../../selectors.js'
import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import {updateParsedURI} from '../../SendConfirmation/action.js'

const mapStateToProps = (state) => {
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const coreWallet = CORE_SELECTORS.getWallet(state, walletId)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

  return {
    coreWallet,
    currencyCode,
    addressModalVisible: state.ui.scenes.scan.addressModalVisible
  }
}

const mapDispatchToProps = (dispatch) => ({
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  updateParsedURI: (parsedURI) => dispatch(updateParsedURI(parsedURI))
})

export default connect(mapStateToProps, mapDispatchToProps)(AddressModal)
