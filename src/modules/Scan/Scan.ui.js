import React, {  Component } from 'react'
import { Dimensions, StyleSheet, Text, View, TouchableHighlight, TextInput} from 'react-native'
import { connect } from 'react-redux'
import Camera from 'react-native-camera'
import styles from './Scan.style'
import {toggleEnableTorch, toggleAddressModal} from './Scan.action'
import ImagePicker from 'react-native-image-picker'
import Modal from 'react-native-modal'

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

  onBarCodeRead () {

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
        <View style={[styles.overlay]}>
          {this.renderModal()}
          <View style={[styles.overlayTop]}>
            <Text style={styles.overlayTopText}>Scan, to Send, Import, or Edge Login</Text>
          </View>
          <View style={[styles.overlayBlank]}></View>
          <View style={[styles.overlayButtonAreaWrap]}>
              <TouchableHighlight style={[styles.transferButtonWrap]}><Text style={styles.transferButtonText}>Transfer</Text></TouchableHighlight>
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

  renderModal() {
    console.log('re-rendering modal, this.props is: ', this.props)
    return(
        /*<Modal style={[styles.modalElement, this.border('red')]} animationType="none" isVisible={this.props.addressModalVisible} transparent={false} >

        </Modal>*/

        <Modal isVisible={this.props.addressModalVisible}>
          <View style={{ flex: 1 , alignItems: 'center'}}>
            <View style={[styles.modalOverlay, this.border('green')]}>
              <View style={[styles.modalBox, this.border('purple')]}>
                <View style={[styles.modalTopTextWrap]}>
                  <Text style={styles.modalTopText}>Send to Bitcoin Address or Import Private Key:</Text>
                </View>
                <View style={[styles.modalMiddle]}>
                  <View style={[styles.addressInputWrap]}>
                    <TextInput style={[styles.addressInput]} placeholder="Insert Address Here"></TextInput>
                  </View>
                </View>
                <View style={[styles.modalBottom]}>
                  <View></View>
                  <View></View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
    )
  }

}

export default connect( state => ({
  torchEnabled: state.scan.torchEnabled,
  addressModalVisible: state.scan.addressModalVisible
  })
)(Scan)
