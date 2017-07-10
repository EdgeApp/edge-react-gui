import React, { Component } from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {
  ActivityIndicator,
  Text,
  View,
  TouchableHighlight,
  TextInput,
  Clipboard } from 'react-native'
import T from '../../components/FormattedText'
import LinearGradient from 'react-native-linear-gradient'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import Ionicon from 'react-native-vector-icons/Ionicons'
import ImagePicker from 'react-native-image-picker'
import Modal from 'react-native-modal'
import { Actions } from 'react-native-router-flux'
import Camera from 'react-native-camera'
import * as PERMISSIONS from '../../permissions.js'
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
import {border as b} from '../../../utils'


class Scan extends Component {
  constructor (props) {
    super(props)
    this.state = {
      cameraPermission: undefined
    }
  }
  //check the status of a single permission
  componentDidMount() {
    PERMISSIONS.request('camera')
    .then(this.setCameraPermission)
  }

  setCameraPermission = (cameraPermission) => {
    this.setState({
      cameraPermission
    })
  }

  _onToggleTorch = () => {
    this.props.toggleEnableTorch()
    PERMISSIONS.request('camera')
    .then(this.setCameraPermission)
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

  renderCamera = () => {
    if (this.state.cameraPermission === true && this.props.scene === 'scan') {
      return (
        <Camera
          style={styles.preview}
          barCodeTypes={['org.iso.QRCode']}
          onBarCodeRead={this.onBarCodeRead}
          ref='cameraCapture'
        />
      )
    } else if (this.state.cameraPermission === false) {
      return (
        <View style={[styles.preview, {justifyContent: 'center', alignItems: 'center'}]}>
          <Text>To scan QR codes, enable camera permission in your system settings</Text>
        </View>
      )
    } else {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size='large' style={{flex: 1, alignSelf: 'center'}} />
        </View>
      )
    }
  }

  render () {
    return (
      <View style={styles.container}>
        {this.renderCamera()}
        <View style={[styles.overlay, b('red')]}>

          <WalletAddressModalConnect />

          <View style={[styles.overlayTop, b('yellow')]}>
            <T style={[styles.overlayTopText, b('green')]}>{sprintf(strings.enUS['send_scan_header_text'])}</T>
          </View>
          <View style={[styles.overlayBlank]} />
          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3B7ADA', '#2B5698']} style={[styles.overlayButtonAreaWrap, b('red')]}>
            <TouchableHighlight style={[styles.transferButtonWrap, styles.bottomButton]} onPress={this._onToggleWalletListModal.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-arrow-round-forward' size={24} style={[styles.transferArrowIcon, b('green')]} />
                <T style={[styles.transferButtonText, styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_transfer'])}</T>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.addressButtonWrap, styles.bottomButton, b('yellow')]} onPress={this._onToggleAddressModal.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <FAIcon name='address-book-o' size={18} style={[styles.addressBookIcon, b('green')]} />
                <T style={[styles.addressButtonText, styles.bottomButtonText, b('purple')]}>{sprintf(strings.enUS['fragment_send_address'])}</T>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.photosButtonWrap, styles.bottomButton]} onPress={this.selectPhotoTapped.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-camera-outline' size={24} style={[styles.cameraIcon, b('green')]} />
                <T style={[styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_photos'])}</T>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.flashButtonWrap, styles.bottomButton]} onPress={this._onToggleTorch.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-flash-outline' size={24} style={[styles.flashIcon, b('green')]} />
                <T style={[styles.flashButtonText, styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_flash'])}</T>
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
    scene:                             state.routes.scene.name,
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
    console.log('recipient address done, this.props.recipientAddress is: ', this.props.recipientAddress)
    updateUri(this.props.recipientAddress)
    this.props.dispatch(updatePublicAddress(this.props.recipientAddress))
    this._onToggleAddressModal()
    Actions.sendConfirmation({ type: 'reset' , recipientPublicAddress: this.props.recipientAddress, testing: 'kylan'})
  }
  _onToggleAddressModal = () => {
    this.props.dispatch(toggleAddressModal())
  }

  render( ) {
    return(
      <View style={[ModalStyle.buttonsWrap, b('gray')]}>
        <TouchableHighlight onPress={this._onToggleAddressModal} style={[ModalStyle.cancelButtonWrap, ModalStyle.stylizedButton]}>
          <View style={ModalStyle.stylizedButtonTextWrap}>
            <T style={[ModalStyle.cancelButton, ModalStyle.stylizedButtonText]}>{sprintf(strings.enUS['string_cancel_cap'])}</T>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPress={this._onModalDone} style={[ModalStyle.doneButtonWrap, ModalStyle.stylizedButton]}>
            <View style={ModalStyle.stylizedButtonTextWrap}>
              <T style={[ModalStyle.doneButton, ModalStyle.stylizedButtonText]}>{sprintf(strings.enUS['string_done_cap'])}</T>
            </View>
          </TouchableHighlight>
      </View>
    )
  }
}

const SendAddressButtonsConnect = connect(state => ({
  recipientAddress: state.ui.scenes.scan.recipientAddress,
}))(SendAddressButtons)
