import React, {Component} from 'react'
import {
  Alert,
  Clipboard
} from 'react-native'
import {connect} from 'react-redux'
import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import {Actions} from 'react-native-router-flux'
import StylizedModal from '../../../components/Modal/Modal.ui'
import * as WALLET_API from '../../../../Core/Wallets/api.js'
import {toggleAddressModal} from '../action'
import {AddressInput} from './AddressInput.js'
import {AddressInputButtons} from './AddressInputButtons.js'
import * as UI_SELECTORS from '../../../selectors.js'
import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import {updateParsedURI} from '../../SendConfirmation/action.js'

class AddressModal extends Component {
  constructor (props) {
    super(props)

    this.state = {
      uri: '',
      clipboard: ''
    }
  }

  componentDidMount () {
    // const coreWallet = this.props.coreWallet
    Clipboard.getString().then((uri) => {
      try {
        // const parsedURI = WALLET_API.parseURI(coreWallet, uri)
        // console.log('AddressModal parsedURI', parsedURI)
        this.setState({
          clipboard: uri
        })
      } catch (e) {
        // console.log('Clipboard does not contain a valid address.')
        // console.log(`Clipboard: ${uri}`)
        // console.log(e)
      }
    })
  }

  onPasteFromClipboard = () => {
    this.setState({uri: this.state.clipboard}, this.onSubmit)
  }

  onSubmit = () => {
    const uri = this.state.uri
    const coreWallet = this.props.coreWallet
    try {
      const parsedURI = WALLET_API.parseURI(coreWallet, uri)
      parsedURI.currencyCode = this.props.currencyCode // remove when Ethereum addresses support indicating currencyCodes

      // console.log('AddressModal parsedURI', parsedURI)
      this.props.dispatch(toggleAddressModal())
      this.props.dispatch(updateParsedURI(parsedURI))
      Actions.sendConfirmation()
    } catch (e) {
      Alert.alert(
        'Invalid Address',
        'The address you input is not a valid address.'
      )
      // console.log(e)
    }
  }
  onCancel = () => {
    this.props.dispatch(toggleAddressModal())
  }

  onChangeText = (uri) => {
    this.setState({uri})
  }

  render () {
    const icon = <FAIcon name='address-book-o' size={24} color='#2A5799'
      style={[{
        position: 'relative',
        top: 12,
        left: 13,
        height: 24,
        width: 24,
        backgroundColor: 'transparent',
        zIndex: 1015,
        elevation: 1015}]} />

    const copyMessage
      = this.state.clipboard
      ? sprintf(strings.enUS['string_paste_address'], this.state.clipboard)
      : null
    const middle = <AddressInput
      copyMessage={copyMessage}
      onChangeText={this.onChangeText}
      onSubmit={this.onSubmit}
      onPaste={this.onPasteFromClipboard} />

    const bottom = <AddressInputButtons
      onSubmit={this.onSubmit}
      onCancel={this.onCancel} />

    return (
      <StylizedModal
        featuredIcon={icon}
        headerText='fragment_send_address_dialog_title'
        modalMiddle={middle}
        modalBottom={bottom}
        visibilityBoolean={this.props.addressModalVisible}
      />
    )
  }
}
export const AddressModalConnect = connect((state) => {
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const coreWallet = CORE_SELECTORS.getWallet(state, walletId)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)

  return {
    coreWallet,
    currencyCode,
    addressModalVisible: state.ui.scenes.scan.addressModalVisible
  }
})(AddressModal)
