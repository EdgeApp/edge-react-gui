// @flow

import type { EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import React, { Component } from 'react'
import { Clipboard } from 'react-native'
import slowlog from 'react-native-slowlog'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import * as WALLET_API from '../../modules/Core/Wallets/api.js'
import StylizedModal from '../../modules/UI/components/Modal/Modal.ui'
import styles from '../../styles/scenes/ScaneStyle'
import { colors } from '../../theme/variables/airbitz.js'
import { AddressInput } from '../common/AddressInput.js'
import { AddressInputButtons } from '../common/AddressInputButtons.js'

type Props = {
  coreWallet: EdgeCurrencyWallet,
  currencyCode: string,
  addressModalVisible: boolean,
  toggleAddressModal(): void,
  updateParsedURI(EdgeParsedUri): void,
  loginWithEdge(string): void,
  doneButtonPressed(string): void,
  onExitButtonFxn: void
}
type State = {
  uri: string,
  clipboard: string
}

export default class AddressModal extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      uri: '',
      clipboard: ''
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  async _setClipboard (props: Props) {
    const coreWallet = props.coreWallet

    try {
      const uri = await Clipboard.getString()

      // Will throw in case uri is invalid
      await WALLET_API.parseUri(coreWallet, uri)

      this.setState({
        clipboard: uri
      })
    } catch (e) {
      // console.log('Clipboard does not contain a valid address.')
      // console.log(`Clipboard: ${uri}`)
      // console.log(e)
    }
  }

  _flushUri () {
    this.setState({
      uri: ''
    })
  }

  componentDidMount () {
    this._setClipboard(this.props)
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    this._setClipboard(nextProps)
    const uriShouldBeCleaned = !this.props.addressModalVisible && !!this.state.uri.length
    if (uriShouldBeCleaned) {
      this._flushUri()
    }
  }

  render () {
    const icon = <FAIcon name={Constants.ADDRESS_BOOK_O} size={24} color={colors.primary} style={styles.icon} />

    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const middle = (
      <AddressInput
        copyMessage={copyMessage}
        onChangeText={this.onChangeText}
        onSubmit={this.onSubmit}
        onPaste={this.onPasteFromClipboard}
        uri={this.state.uri}
      />
    )

    const bottom = <AddressInputButtons onSubmit={this.onSubmit} onCancel={this.onCancel} />

    return (
      <StylizedModal
        featuredIcon={icon}
        headerText={s.strings.fragment_send_address_dialog_title}
        modalMiddle={middle}
        modalBottom={bottom}
        visibilityBoolean={this.props.addressModalVisible}
        onExitButtonFxn={this.props.onExitButtonFxn}
        style={copyMessage && styles.withAddressCopied}
        modalBottomStyle={{ marginTop: 0 }}
      />
    )
  }

  onPasteFromClipboard = () => {
    this.setState({ uri: this.state.clipboard }, this.onSubmit)
  }

  onSubmit = () => {
    const uri = this.state.uri
    this.props.toggleAddressModal()
    this.props.doneButtonPressed(uri)
  }
  onCancel = () => {
    this.props.toggleAddressModal()
  }

  onChangeText = (uri: string) => {
    this.setState({ uri })
  }
}
