import React, { Component } from 'react'
import t from '../../../../lib/LocaleStrings'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import { Text, View, TouchableHighlight, TextInput, Clipboard} from 'react-native'
import FormattedText from '../../components/FormattedText'
import LinearGradient from 'react-native-linear-gradient'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import Ionicon from 'react-native-vector-icons/Ionicons'
import ImagePicker from 'react-native-image-picker'
import Modal from 'react-native-modal'
import { Actions } from 'react-native-router-flux'
import Camera from 'react-native-camera'
import WalletTransferList from '../WalletTransferList/WalletTransferList.ui'
import styles from './style'
import { WalletListModalConnect } from '../../components/WalletListModal/WalletListModal.ui'
import { toggleScanToWalletListModal } from '../../components/WalletListModal/action'
import { toggleEnableTorch, toggleAddressModal, updateRecipientAddress  } from './action'

import {
  updateUri,
  updatePublicAddress,
  updateWalletTransfer
} from '../SendConfirmation/action.js'

import { toggleWalletListModal } from '../WalletTransferList/action'
import { getWalletTransferList } from '../WalletTransferList/middleware'
import StylizedModal from '../../components/Modal/Modal.ui'
import {TertiaryButton} from '../../components/Buttons'
import ModalStyle from '../../components/Modal/style'
import {border} from '../../../../util/border'


class Scan extends Component {
  _onToggleTorch = () => {
    this.props.toggleEnableTorch()
  }

  _onToggleAddressModal = () => {
    this.props.toggleAddressModal()
  }

  _onToggleWalletListModal () {
    this.props.dispatch(toggleScanToWalletListModal())
  }

  onBarCodeRead = (data) => {
    this.props.updateUri(data)
    Actions.sendConfirmation({ type: 'reset' })
    // React Native Router Flux does not fully unmount scenes when transitioning
    // {type: 'reset'} is needed to fully unmount the Scan scene, or else the camera will keep scanning
  }

  selectPhotoTapped = () => {
    const options = { takePhotoButtonTitle: null }

    ImagePicker.showImagePicker(options, (response) => {

      if (response.didCancel) {
        console.log('User cancelled photo picker')
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error)
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton)
      } else {
        let source = { uri: response.uri }
        // this.refs.cameraCapture.capture({})
        // You can also display the image using data:
        // let source = { uri: 'data:image/jpeg;base64,' + response.data };

        Actions.sendConfirmation({ type: 'reset' })
      }
    })
  }

  render () {
    return (
      <View style={styles.container}>
        <Camera
          style={styles.preview}
          barCodeTypes={['qr']}
          onBarCodeRead={this.onBarCodeRead}
          ref='cameraCapture'
        />
        <View style={[styles.overlay, border('red')]}>

          <WalletAddressModalConnect />

          <View style={[styles.overlayTop, border('yellow')]}>
            <FormattedText style={[styles.overlayTopText, border('green')]}>{sprintf(strings.enUS['send_scan_header_text'])}</FormattedText>
          </View>
          <View style={[styles.overlayBlank]} />
          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3B7ADA', '#2B5698']} style={[styles.overlayButtonAreaWrap, border('red')]}>
            <TouchableHighlight style={[styles.transferButtonWrap, styles.bottomButton]} onPress={this._onToggleWalletListModal.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-arrow-round-forward' size={24} style={[styles.transferArrowIcon, border('green')]} />
                <FormattedText style={[styles.transferButtonText, styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_transfer'])}</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.addressButtonWrap, styles.bottomButton, border('yellow')]} onPress={this._onToggleAddressModal.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <FAIcon name='address-book-o' size={18} style={[styles.addressBookIcon, border('green')]} />
                <FormattedText style={[styles.addressButtonText, styles.bottomButtonText, border('purple')]}>{sprintf(strings.enUS['fragment_send_address'])}</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.photosButtonWrap, styles.bottomButton]} onPress={this.selectPhotoTapped.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-camera-outline' size={24} style={[styles.cameraIcon, border('green')]} />
                <FormattedText style={[styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_photos'])}</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.flashButtonWrap, styles.bottomButton]} onPress={this._onToggleTorch.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-flash-outline' size={24} style={[styles.flashIcon, border('green')]} />
                <FormattedText style={[styles.flashButtonText, styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_flash'])}</FormattedText>
              </View>
            </TouchableHighlight>
          </LinearGradient>
        </View>
      </View>
    )
  }
}

const mapStateToProps = state => {
  return {
    torchEnabled:                      state.ui.scenes.scan.torchEnabled,
    walletListModalVisible:            state.ui.scenes.walletTransferList.walletListModalVisible,
    scanFromWalletListModalVisibility: state.ui.scenes.scan.scanFromWalletListModalVisibility,
    scanToWalletListModalVisibility:   state.ui.scenes.scan.scanToWalletListModalVisibility
  }
}

const mapDispatchToProps = dispatch => {
  return {
    toggleEnableTorch: () => dispatch(toggleEnableTorch()),
    toggleAddressModal: () => dispatch(toggleAddressModal()),
    toggleWalletListModal: () => dispatch(toggleWalletListModal()),
    getWalletTransferList: () => dispatch(getWalletTransferList()),

    updateUri: uri => dispatch(updateUri(uri)),
    updatePublicAddress: publicAddress => dispatch(updatePublicAddress(publicAddress)),
    updateWalletTransfer: wallet => dispatch(updateWalletTransfer(wallet))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Scan)

class WalletAddressModal extends Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  render() {

    return(
      <StylizedModal
        featuredIcon={<FAIcon name='address-book-o'size={24} color="#2A5799" style={[{position: 'relative', top:12, left:13, height: 24, width: 24, backgroundColor: 'transparent', zIndex: 1015, elevation: 1015}]} />}
        headerText='fragment_send_address_dialog_title'
        modalMiddle={<AddressInputRecipientConnect />}
        modalBottom={<SendAddressButtonsConnect />}
        visibilityBoolean={this.props.addressModalVisible}
      />
    )
  }
}

export const WalletAddressModalConnect = connect( state => ({
  addressModalVisible: state.ui.scenes.scan.addressModalVisible,
}))(WalletAddressModal)

class AddressInputRecipient extends Component { // this component is for the input area of the Recipient Address Modal
  constructor(props) {
    super(props)
    this.state = {
      copiedString: '',
      recipientAddressInput: ''
    }
  }

  componentWillMount() {
    Clipboard.getString().then(string => this.setState({copiedString: string}))    
  }

  _onRecipientAddressChange = (input) => {
    this.setState({ recipientAddressInput: input })
    this.props.dispatch(updateRecipientAddress(input))    
  }

  _copyOverAddress = () => {
    this.setState({ recipientAddressInput: this.state.copiedString })
    this.props.dispatch(updateRecipientAddress(this.state.copiedString))
  }

  render() {
    let innerText = ''
    console.log('rendering Rename Address, this.state is: ', this.state)
    if( this.state.copiedString.length !== 0) innerText = sprintf(strings.enUS['fragment_copy_button_syntax']) + ' "' + this.state.copiedString.slice(0, 10) + ' ... ' + this.state.copiedString.slice(-10) + '"'

    return(
      <View>
        <View style={[styles.addressInputWrap]}>
            <TextInput style={[styles.addressInput]} onChangeText={(input) => this._onRecipientAddressChange(input)} value={this.props.recipientAddress} />
        </View>
        {this.state.copiedString.length !== 0 &&
          <View style={styles.pasteButtonRow}>
            <TertiaryButton text={innerText} onPressFunction={this._copyOverAddress} />
          </View>
        }
      </View>
    )
  }
}

export const AddressInputRecipientConnect = connect( state => ({
  recipientAddress: state.ui.scenes.scan.recipientAddress
}))(AddressInputRecipient)



class SendAddressButtons extends Component { // this component is for the button area of the Recipient Address Modal
  _onModalDone = () => {
    updateUri(this.props.recipientAddress)
    this.props.dispatch(updatePublicAddress(this.props.recipientAddress))
    this._onToggleAddressModal()
    Actions.sendConfirmation({ type: 'reset' })
  }
  _onToggleAddressModal = () => {
    this.props.dispatch(toggleAddressModal())
  }

  render( ) {
    return(
      <View style={[ModalStyle.buttonsWrap, border('gray')]}>
        <TouchableHighlight onPress={this._onToggleAddressModal} style={[ModalStyle.cancelButtonWrap, ModalStyle.stylizedButton]}>
          <View style={ModalStyle.stylizedButtonTextWrap}>
            <FormattedText style={[ModalStyle.cancelButton, ModalStyle.stylizedButtonText]}>{sprintf(strings.enUS['string_cancel_cap'])}</FormattedText>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPress={this._onModalDone} style={[ModalStyle.doneButtonWrap, ModalStyle.stylizedButton]}>
            <View style={ModalStyle.stylizedButtonTextWrap}>
              <FormattedText style={[ModalStyle.doneButton, ModalStyle.stylizedButtonText]}>{sprintf(strings.enUS['string_done_cap'])}</FormattedText>
            </View>
          </TouchableHighlight>
      </View>
    )
  }
}

const SendAddressButtonsConnect = connect(state => ({
  recipientAddress: state.ui.scenes.scan.recipientAddress,
}))(SendAddressButtons)
