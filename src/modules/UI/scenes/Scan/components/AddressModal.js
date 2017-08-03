import React, { Component } from 'react'
import {
  Clipboard
} from 'react-native'
import { connect } from 'react-redux'
import strings from '../../../../../locales/default'
import { sprintf } from 'sprintf-js'
import FAIcon from 'react-native-vector-icons/FontAwesome'

import StylizedModal from '../../../components/Modal/Modal.ui'
import * as WALLET_API from '../../../../Core/Wallets/api.js'
import { toggleAddressModal } from '../action'
import { AddressInput } from './AddressInput.js'
import { AddressInputButtons } from './AddressInputButtons.js'

class WalletAddressModal extends Component {
  constructor (props) {
    super(props)

    this.state = {
      uri: '',
      clipboard: ''
    }
  }

  componentDidMount () {
    Clipboard.getString().then(uri => {
      const wallet = this.props.coreWallet
      try {
        WALLET_API.parseURI(wallet, uri)
        this.setState({
          clipboard: uri
        })
      } catch (e) {
        console.log(e)
      }
    })
  }

  onPasteFromClipboard = () => {
    this.setState({ uri: this.state.clipboard }, this.onSubmit)
  }
  onSubmit = () => {
    this.props.dispatch(toggleAddressModal())
    this.props.dispatch(processURI(this.state.uri))
    Actions.sendConfirmation()
  }
  onCancel = () => {
    this.props.dispatch(toggleAddressModal())
  }

  onChangeText = (uri) => {
    this.setState({ uri })
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

    const copyMessage = sprintf(strings.enUS['string_paste_address'], this.state.clipboard)
    const middle = <AddressInput
      copyMessage={copyMessage}
      onChangeText={this.onChangeText}
      onSubmit={this.processURI}
      onPaste={this.onPasteFromClipboard} />

    const bottom = <AddressInputButtons
      onSubmit={this.processURI}
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
export const WalletAddressModalConnect = connect(state => {
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const coreWallet = CORE_SELECTORS.getWallet(state, walletId)

  return {
    coreWallet,
    addressModalVisible: state.ui.scenes.scan.addressModalVisible
  }
})(WalletAddressModal)
