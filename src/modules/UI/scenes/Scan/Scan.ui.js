import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {
  ActivityIndicator,
  Alert,
  Text,
  View,
  TouchableHighlight
} from 'react-native'
import T from '../../components/FormattedText'
import LinearGradient from 'react-native-linear-gradient'
import {connect} from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'
import ImagePicker from 'react-native-image-picker'
import {Actions} from 'react-native-router-flux'
import Camera from 'react-native-camera'
import * as PERMISSIONS from '../../permissions'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'

import styles from './style'
import {toggleScanToWalletListModal} from '../../components/WalletListModal/action'
import {toggleEnableTorch, toggleAddressModal} from './action'

import {
  updateParsedURI,
  updatePublicAddressRequest,
  updateWalletTransfer
} from '../SendConfirmation/action.js'

import {toggleWalletListModal} from '../WalletTransferList/action'
import {AddressModalConnect} from './components/AddressModal.js'

class Scan extends Component {
  constructor (props) {
    super(props)
    this.state = {
      cameraPermission: undefined
    }
  }
  // check the status of a single permission
  componentDidMount () {
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

  _onToggleWalletListModal = () => {
    this.props.dispatch(toggleScanToWalletListModal())
  }

  onBarCodeRead = (scan) => {
    if (this.props.scene !== 'scan') return
    const uri = scan.data
    this.parseURI(uri)
  }

  parseURI = (uri) => {
    try {
      console.log('uri', uri)
      const parsedURI = WALLET_API.parseURI(this.props.coreWallet, uri)
      this.props.updateParsedURI(parsedURI)
      Actions.sendConfirmation()
    } catch (error) {
      Alert.alert('Scanning Error', error.toString())
      // show popup with error message
      console.log(error)
    }
  }

  selectPhotoTapped = () => {
    const options = {takePhotoButtonTitle: null}

    ImagePicker.showImagePicker(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled photo picker')
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error)
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton)
      } else {
        // this.refs.cameraCapture.capture({})
        // You can also display the image using data:
        // let source = { uri: 'data:image/jpeg;base64,' + response.data };

        Actions.sendConfirmation({type: 'reset'})
      }
    })
  }

  renderCamera = () => {
    // if (this.state.cameraPermission === true && this.props.scene === 'scan') {
    if (this.state.cameraPermission === true) {
      return (
        <Camera
          style={styles.preview}
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
        <View style={[styles.overlay]}>

          <AddressModalConnect />

          <View style={[styles.overlayTop]}>
            <T style={[styles.overlayTopText]}>{sprintf(strings.enUS['send_scan_header_text'])}</T>
          </View>
          <View style={[styles.overlayBlank]} />

          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3B7ADA', '#2B5698']} style={[styles.overlayButtonAreaWrap]}>

            <TouchableHighlight style={[styles.transferButtonWrap, styles.bottomButton]} onPress={this._onToggleWalletListModal} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-arrow-round-forward' size={24} style={[styles.transferArrowIcon]} />
                <T style={[styles.transferButtonText, styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_transfer'])}</T>
              </View>
            </TouchableHighlight>

            <TouchableHighlight style={[styles.addressButtonWrap, styles.bottomButton]} onPress={this._onToggleAddressModal} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <FAIcon name='address-book-o' size={18} style={[styles.addressBookIcon]} />
                <T style={[styles.addressButtonText, styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_address'])}</T>
              </View>
            </TouchableHighlight>

            <TouchableHighlight style={[styles.photosButtonWrap, styles.bottomButton]} onPress={this.selectPhotoTapped} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-camera-outline' size={24} style={[styles.cameraIcon]} />
                <T style={[styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_photos'])}</T>
              </View>
            </TouchableHighlight>

            <TouchableHighlight style={[styles.flashButtonWrap, styles.bottomButton]} onPress={this._onToggleTorch} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-flash-outline' size={24} style={[styles.flashIcon]} />
                <T style={[styles.flashButtonText, styles.bottomButtonText]}>{sprintf(strings.enUS['fragment_send_flash'])}</T>
              </View>
            </TouchableHighlight>

          </LinearGradient>

        </View>
      </View>
    )
  }
}
const mapStateToProps = (state) => {
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const coreWallet = CORE_SELECTORS.getWallet(state, walletId)

  return {
    coreWallet,
    scene: state.routes.scene.name,
    torchEnabled: state.ui.scenes.scan.torchEnabled,
    walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
    scanFromWalletListModalVisibility: state.ui.scenes.scan.scanFromWalletListModalVisibility,
    scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility
  }
}
const mapDispatchToProps = dispatch => ({
  toggleEnableTorch: () => dispatch(toggleEnableTorch()),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  toggleWalletListModal: () => dispatch(toggleWalletListModal()),
  updateParsedURI: (parsedURI) => dispatch(updateParsedURI(parsedURI)),
  updatePublicAddress: publicAddress => dispatch(updatePublicAddressRequest(publicAddress)),
  updateWalletTransfer: wallet => dispatch(updateWalletTransfer(wallet))
})
export default connect(mapStateToProps, mapDispatchToProps)(Scan)
