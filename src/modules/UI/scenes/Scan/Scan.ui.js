// @flow

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
// $FlowFixMe
import LinearGradient from 'react-native-linear-gradient'
import {connect} from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'
// $FlowFixMe
import ImagePicker from 'react-native-image-picker'
import {Actions} from 'react-native-router-flux'
import Camera from 'react-native-camera'
// $FlowFixMe Doesn't know how to find platform specific imports
import * as PERMISSIONS from '../../permissions'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type {AbcCurrencyWallet, AbcParsedUri} from 'airbitz-core-types'

import styles from './style'
import {toggleScanToWalletListModal} from '../../components/WalletListModal/action'
import {toggleEnableTorch, toggleAddressModal} from './action'

import {
  updateParsedURI
  // updatePublicAddressRequest,
  // updateWalletTransfer
} from '../SendConfirmation/action.js'

import {toggleWalletListModal} from '../WalletTransferList/action'
import {AddressModalConnect} from './components/AddressModal.js'

type Props = {
  abcWallet: AbcCurrencyWallet,
  sceneName: string,
  torchEnabled: boolean,
  walletListModalVisible: boolean,
  scanFromWalletListModalVisibility: any,
  scanToWalletListModalVisibility: any,
  toggleEnableTorch(): void,
  toggleAddressModal():void,
  toggleWalletListModal(): void,
  updateParsedURI(AbcParsedUri): void
}

class Scan extends Component<any, any, any> {
  state: {
    cameraPermission?: boolean
  }

  constructor (props: Props) {
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

  onBarCodeRead = (scan: {data: any}) => {
    if (this.props.sceneName !== 'scan') return
    const uri = scan.data
    this.parseURI(uri)
  }

  parseURI = (uri) => {
    try {
      // console.log('uri', uri)
      const parsedURI = WALLET_API.parseURI(this.props.abcWallet, uri)
      this.props.updateParsedURI(parsedURI)
      Actions.sendConfirmation()
    } catch (error) {
      Alert.alert('Scanning Error', error.toString())
      // show popup with error message
      // console.log(error)
    }
  }

  selectPhotoTapped = () => {
    const options = {takePhotoButtonTitle: null}

    ImagePicker.showImagePicker(options, (response) => {
      if (!response.didCancel
        && !response.error
        && !response.customButton) {
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
  const abcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, walletId)
  const sceneName = state.routes.scene.children
    ? state.routes.scene.children[state.routes.scene.index].name
    : null

  return {
    abcWallet,
    sceneName,
    torchEnabled: state.ui.scenes.scan.torchEnabled,
    walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
    scanFromWalletListModalVisibility: state.ui.scenes.scan.scanFromWalletListModalVisibility,
    scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility
  }
}
const mapDispatchToProps = (dispatch) => ({
  toggleEnableTorch: () => dispatch(toggleEnableTorch()),
  toggleAddressModal: () => dispatch(toggleAddressModal()),
  toggleWalletListModal: () => dispatch(toggleWalletListModal()),
  updateParsedURI: (parsedURI) => dispatch(updateParsedURI(parsedURI)),
  // updatePublicAddress: (publicAddress) => dispatch(updatePublicAddressRequest(publicAddress)),
  // updateWalletTransfer: (wallet) => dispatch(updateWalletTransfer(wallet))
})
export default connect(mapStateToProps, mapDispatchToProps)(Scan)
