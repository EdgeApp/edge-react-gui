import React, { Component } from 'react'
import { Dimensions, StyleSheet, Text, View, TouchableHighlight, TextInput} from 'react-native'
import FormattedText from '../../components/FormattedText'
import LinearGradient from 'react-native-linear-gradient'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'
import MAIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import ImagePicker from 'react-native-image-picker'
import Modal from 'react-native-modal'
import { Actions } from 'react-native-router-flux'
import Camera from 'react-native-camera'
import WalletTransferList from '../WalletTransferList/WalletTransferList.ui'
import styles from './style'
import {WalletListModalConnect} from '../../components/WalletListModal/WalletListModal.ui'

import { toggleEnableTorch, toggleAddressModal, updateRecipientAddress } from './action'
import { toggleWalletListModal } from '../WalletTransferList/action'
import { getWalletTransferList } from '../WalletTransferList/middleware'

class Scan extends Component {
  constructor (props) {
    super(props)
  }

  _onToggleTorch () {
    this.props.dispatch(toggleEnableTorch())
  }

  _onToggleAddressModal () {
    this.props.dispatch(toggleAddressModal())
  }

  _onToggleWalletListModal () {
    if (!this.props.walletListModalVisible) {
      this.props.dispatch(getWalletTransferList())
    }
    this.props.dispatch(toggleWalletListModal())
  }

  onBarCodeRead () {
    console.log('onBarCodeRead executing')
  }

  selectPhotoTapped () {
    const options = { takePhotoButtonTitle: null }

    ImagePicker.showImagePicker(options, (response) => {
      console.log('Response = ', response)

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

        console.log('response is: ', response)
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
        <View style={[styles.overlay, this.border('red')]}>
          {this.props.walletListModalVisible && 
            <WalletListModalConnect topDisplacement={0} />
            }            
          {this.renderAddressModal()}
          <View style={[styles.overlayTop, this.border('yellow')]}>
            <FormattedText style={[styles.overlayTopText, this.border('green')]}>Scan, to Send, import, or Edge Login</FormattedText>
          </View>
          <View style={[styles.overlayBlank]} />
          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3B7ADA', '#2B5698']} style={[styles.overlayButtonAreaWrap, this.border('red')]}>
            <TouchableHighlight style={[styles.transferButtonWrap, styles.bottomButton]} onPress={this._onToggleWalletListModal.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name="ios-arrow-round-forward" size={24} style={[styles.transferArrowIcon, this.border('green')]} />
                <FormattedText style={[styles.transferButtonText, styles.bottomButtonText]}>Transfer</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.addressButtonWrap, styles.bottomButton, this.border('yellow')]} onPress={this._onToggleAddressModal.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <FAIcon name="address-book-o" size={18} style={[styles.addressBookIcon, this.border('green')]} />
                <FormattedText style={[styles.addressButtonText, styles.bottomButtonText, this.border('purple')]}>Address</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.photosButtonWrap, styles.bottomButton]} onPress={this.selectPhotoTapped.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name="ios-camera-outline" size={24} style={[styles.cameraIcon, this.border('green')]} />
                <FormattedText style={[styles.bottomButtonText]}>Photos</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.flashButtonWrap, styles.bottomButton]} onPress={this._onToggleTorch.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name="ios-flash-outline" size={24} style={[styles.flashIcon, this.border('green')]} />
                <FormattedText style={[styles.flashButtonText, styles.bottomButtonText]}>Flash</FormattedText>
              </View>
            </TouchableHighlight>
          </LinearGradient>
        </View>
      </View>
    )
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }

  _onRecipientAddressChange (input) {
    this.props.dispatch(updateRecipientAddress(input))
  }

  _onModalDone () {
    this._onToggleAddressModal()
    Actions.sendConfirmation(this.props.receipientAddress)
  }

  renderAddressModal () {
    return (
      <Modal isVisible={this.props.addressModalVisible}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalOverlay]}>
            <View style={[styles.modalBox]}>
              <View style={[styles.modalTopTextWrap]}>
                <Text style={styles.modalTopText}>Send to Bitcoin Address or Import Private Key:</Text>
              </View>
              <View style={[styles.modalMiddle]}>
                <View style={[styles.addressInputWrap]}>
                  <TextInput style={[styles.addressInput]} onChangeText={(input) => this._onRecipientAddressChange(input)} />
                </View>
              </View>
              <View style={[styles.modalBottom]}>
                <View style={[styles.emptyBottom]} />
                <View style={[styles.buttonsWrap]}>
                  <TouchableHighlight onPress={this._onToggleAddressModal.bind(this)} style={[styles.cancelButtonWrap]}>
                    <Text style={styles.cancelButton}>CANCEL</Text>
                  </TouchableHighlight>
                  <TouchableHighlight onPress={this._onModalDone.bind(this)} style={[styles.doneButtonWrap]}>
                    <Text style={styles.doneButton}>DONE</Text>
                  </TouchableHighlight>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    )
  }
}

export default connect(state => ({
  torchEnabled: state.ui.scan.torchEnabled,
  addressModalVisible: state.ui.scan.addressModalVisible,
  receipientAddress: state.ui.scan.recipientAddress,
  walletListModalVisible: state.ui.walletTransferList.walletListModalVisible
})
)(Scan)