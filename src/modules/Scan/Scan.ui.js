import React, {  Component } from 'react'
import { Dimensions, StyleSheet, Text, View, TouchableHighlight, TextInput} from 'react-native'
import { connect } from 'react-redux'
import Camera from 'react-native-camera'
import styles from './Scan.style'
import {toggleEnableTorch, toggleAddressModal, updateRecipientAddress } from './Scan.action'
import {toggleWalletListModal} from '../WalletTransferList/WalletTransferList.action'
import ImagePicker from 'react-native-image-picker'
import Modal from 'react-native-modal'
import { Actions } from 'react-native-router-flux'
import WalletTransferList from '../WalletTransferList/WalletTransferList.ui'
import {getWalletTransferList} from '../WalletTransferList/WalletTransferList.middleware'

class Scan extends Component {
  constructor (props) {
    super(props)
  }

  _onToggleTorch() {
    this.props.dispatch(toggleEnableTorch())
  }

  _onToggleAddressModal() {
    this.props.dispatch(toggleAddressModal())
  }

  _onToggleWalletListModal() {
    if(!this.props.walletListModalVisible) this.props.dispatch(getWalletTransferList())
    this.props.dispatch(toggleWalletListModal())
  }

  onBarCodeRead () {
    console.log('onBarCodeRead executing')
  }

  selectPhotoTapped() {
    const options = { takePhotoButtonTitle: null }

    ImagePicker.showImagePicker(options, (response) => {
      console.log('Response = ', response)

      if (response.didCancel) {
        console.log('User cancelled photo picker')
      }
      else if (response.error) {
        console.log('ImagePicker Error: ', response.error)
      }
      else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton)
      }
      else {
        let source = { uri: response.uri }
        //this.refs.cameraCapture.capture({})
        // You can also display the image using data:
        // let source = { uri: 'data:image/jpeg;base64,' + response.data };

        console.log('response is: ', response)
      }
    });
  }

  render () {
    return (
      <View style={styles.container}>
        <Camera
          style={styles.preview}
          barCodeTypes={["qr"]}
          onBarCodeRead={this.onBarCodeRead}
          ref="cameraCapture"
        />
        <View style={[styles.overlay, this.border('green')]}>
          {this.renderAddressModal()}
          {this.renderWalletListModal()}
          <View style={[styles.overlayTop]}>
            <Text style={styles.overlayTopText}>Scan, to Send, Import, or Edge Login</Text>
          </View>
          <View style={[styles.overlayBlank]}></View>
          <View style={[styles.overlayButtonAreaWrap]}>
              <TouchableHighlight style={[styles.transferButtonWrap]} onPress={this._onToggleWalletListModal.bind(this)}><Text style={styles.transferButtonText}>Transfer</Text></TouchableHighlight>
              <TouchableHighlight style={[styles.addressButtonWrap]}  onPress={this._onToggleAddressModal.bind(this)}><Text style={styles.addressButtonText}>Address</Text></TouchableHighlight>
              <TouchableHighlight style={[styles.photosButtonWrap]} onPress={this.selectPhotoTapped.bind(this)}><Text style={{color: 'white'}}>Photos</Text></TouchableHighlight>
              <TouchableHighlight style={[styles.flashButtonWrap]} onPress={this._onToggleTorch.bind(this)} activeOpacity={0.5} underlayColor={'#aaaaaa'}><Text style={styles.flashButtonText}>Flash</Text></TouchableHighlight>
          </View>
        </View>
      </View>
    )
  }

  border(color) {
    return {
      borderColor: color,
      borderWidth: 2
    }
  }

  _onRecipientAddressChange(input) {
    this.props.dispatch(updateRecipientAddress(input))
  }

  _onModalDone() {
    this._onToggleAddressModal()
    Actions.sendConfirmation(this.props.receipientAddress)
  }

  renderAddressModal() {
    return(
        <Modal isVisible={this.props.addressModalVisible}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalOverlay]}>
              <View style={[styles.modalBox]}>
                <View style={[styles.modalTopTextWrap]}>
                  <Text style={styles.modalTopText}>Send to Bitcoin Address or Import Private Key:</Text>
                </View>
                <View style={[styles.modalMiddle]}>
                  <View style={[styles.addressInputWrap]}>
                    <TextInput style={[styles.addressInput]} onChangeText={(input) => this._onRecipientAddressChange(input)}></TextInput>
                  </View>
                </View>
                <View style={[styles.modalBottom]}>
                  <View style={[styles.emptyBottom]}>

                  </View>
                  <View style={[styles.buttonsWrap]}>
                    <TouchableHighlight onPress={this._onToggleAddressModal.bind(this)} style={[styles.cancelButtonWrap]}>
                      <Text style={styles.cancelButton}>CANCEL</Text>
                    </TouchableHighlight>
                    <TouchableHighlight onPress={ this._onModalDone.bind(this) } style={[styles.doneButtonWrap]}>
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

  renderWalletListModal() {
    return(
      <Modal
        isVisible={this.props.walletListModalVisible}>
        <WalletTransferList />
      </Modal>
    )
  }

}

export default connect( state => ({
  torchEnabled: state.ui.scan.torchEnabled,
  addressModalVisible: state.ui.scan.addressModalVisible,
  receipientAddress: state.ui.scan.recipientAddress,
  walletListModalVisible: state.ui.walletTransferList.walletListModalVisible
  })
)(Scan)
