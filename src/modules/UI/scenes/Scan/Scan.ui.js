// @flow

import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {
  ActivityIndicator,
  Alert,
  Text,
  View,
  TouchableHighlight
} from 'react-native'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'
import AddressModal from './components/AddressModalConnector'
// $FlowFixMe
import ImagePicker from 'react-native-image-picker'
import {Actions} from 'react-native-router-flux'
import Camera from 'react-native-camera'
// $FlowFixMe Doesn't know how to find platform specific imports
import * as PERMISSIONS from '../../permissions'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import type {AbcCurrencyWallet, AbcParsedUri} from 'airbitz-core-types'
import * as UTILS from '../../../utils.js'

import styles, {styles as styleRaw} from './style'
import ABAlert from '../../components/ABAlert/indexABAlert'

type Props = {
  abcWallet: AbcCurrencyWallet,
  sceneName: string,
  torchEnabled: boolean,
  scanEnabled: boolean,
  walletListModalVisible: boolean,
  scanFromWalletListModalVisibility: any,
  scanToWalletListModalVisibility: any,
  dispatchEnableScan(): void,
  dispatchDisableScan(): void,
  toggleEnableTorch(): void,
  toggleAddressModal():void,
  toggleWalletListModal(): void,
  updateParsedURI(AbcParsedUri): void,
  loginWithEdge(string): void
}

const HEADER_TEXT     = strings.enUS['send_scan_header_text']

const DENIED_PERMISSION_TEXT = '' // blank string because way off-centered (not sure reason why)
// const TRANSFER_TEXT = strings.enUS['fragment_send_transfer']
const ADDRESS_TEXT  = strings.enUS['fragment_send_address']
// const PHOTOS_TEXT   = strings.enUS['fragment_send_photos']
const FLASH_TEXT    = strings.enUS['fragment_send_flash']

export default class Scan extends Component<any, any> {
  static defaultProps: any;
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

  render () {
    return (
      <View style={styles.container}>
        {this.renderCamera()}
        <View style={[styles.overlay, UTILS.border()]}>

          <AddressModal />

          <View style={[styles.overlayTop]}>
            <T style={[styles.overlayTopText]}>
              {HEADER_TEXT}
            </T>
          </View>
          <View style={[styles.overlayBlank]} />

          <Gradient style={[styles.overlayButtonAreaWrap]}>

            {/* <TouchableHighlight style={styles.bottomButton}
              onPress={this._onToggleWalletListModal}
              underlayColor={styleRaw.underlay.color}>
              <View style={styles.bottomButtonTextWrap}>

                <Ionicon style={[styles.transferArrowIcon]}
                  name='ios-arrow-round-forward'
                  size={24} />
                <T style={[styles.transferButtonText, styles.bottomButtonText]}>
                  {TRANSFER_TEXT}
                </T>

              </View>
            </TouchableHighlight> */}

            <TouchableHighlight style={styles.bottomButton}
              onPress={this._onToggleAddressModal}
              underlayColor={styleRaw.underlay.color}>
              <View style={styles.bottomButtonTextWrap}>

                <FAIcon style={[styles.addressBookIcon]}
                  name='address-book-o'
                  size={18} />
                <T style={[styles.addressButtonText, styles.bottomButtonText]}>
                  {ADDRESS_TEXT}
                </T>

              </View>
            </TouchableHighlight>

            {/* <TouchableHighlight style={styles.bottomButton}
              onPress={this.selectPhotoTapped}
              underlayColor={styleRaw.underlay.color}>
              <View style={styles.bottomButtonTextWrap}>

                <Ionicon style={[styles.cameraIcon]}
                  name='ios-camera-outline'
                  size={24} />
                <T style={[styles.bottomButtonText]}>
                  {PHOTOS_TEXT}
                </T>

              </View>
            </TouchableHighlight> */}

            <TouchableHighlight style={styles.bottomButton}
              onPress={this._onToggleTorch}
              underlayColor={styleRaw.underlay.color}>
              <View style={styles.bottomButtonTextWrap}>

                <Ionicon style={[styles.flashIcon]}
                  name='ios-flash-outline'
                  size={24}  />
                <T style={[styles.flashButtonText, styles.bottomButtonText]}>
                  {FLASH_TEXT}
                </T>

              </View>
            </TouchableHighlight>

          </Gradient>
        </View>
        <ABAlert />
      </View>
    )
  }

  setCameraPermission = (cameraPermission: boolean) => {
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
    this.props.toggleScanToWalletListModal()
  }

  onBarCodeRead = (scan: {data: any}) => {
    if (!this.props.scanEnabled) return
    const uri = scan.data
    this.parseURI(uri)
  }

  parseURI = (uri: string) => {
    try {
      if (/^airbitz:\/\/edge\//.test(uri)) {
        this.props.loginWithEdge(uri)
        return
      }
      // console.log('uri', uri)
      const parsedURI = WALLET_API.parseURI(this.props.abcWallet, uri)
      this.props.updateParsedURI(parsedURI)
      Actions.sendConfirmation()
    } catch (error) {
      this.props.dispatchDisableScan()
      Alert.alert(
        strings.enUS['fragment_send_send_bitcoin_unscannable'],
        error.toString(),
        [
          {text: strings.enUS['string_ok'], onPress: () => this.props.dispatchEnableScan()},
        ]
      )
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
        // TODO: make edgelogin work with image picker -paulvp
        /* if (/^airbitz:\/\/edge\//.test(uri)) {
          console.log('EDGE LOGIN THIS IS A EDGE LOGIN , do the login stuff. ')
          return
        }*/
        Actions.sendConfirmation()
      }
    })
  }

  renderCamera = () => {
    if (this.state.cameraPermission === true) {
      const flashMode = this.props.torchEnabled
        ? Camera.constants.FlashMode.on
        : Camera.constants.FlashMode.off

      return (
        <Camera
          flashMode={flashMode}
          style={styles.preview}
          onBarCodeRead={this.onBarCodeRead}
          ref='cameraCapture' />
      )
    } else if (this.state.cameraPermission === false) {
      return (
        <View style={[styles.preview, {justifyContent: 'center', alignItems: 'center'}, UTILS.border()]}>
          <Text>
            {DENIED_PERMISSION_TEXT}
          </Text>
        </View>
      )
    } else {
      return (
        <View style={[{flex: 1, justifyContent: 'center', alignItems: 'center'}]}>
          <ActivityIndicator size='large' style={{flex: 1, alignSelf: 'center'}} />
        </View>
      )
    }
  }
}
