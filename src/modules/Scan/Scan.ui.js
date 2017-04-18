import React, {  Component } from 'react'
import { StyleSheet, Text, View, TouchableHighlight, Modal, TextInput} from 'react-native'
import { connect } from 'react-redux'
import Camera from 'react-native-camera'
import styles from './Scan.style'
import {toggleEnableTorch, toggleAddressModal} from './Scan.action'
import ImagePicker from 'react-native-image-picker'

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
      borderWidth: 1
    }
  }

  renderModal() {
      <View>
        <Modal style={styles.modal.modalElement} animationType="none" visible={this.props.addressModalVisible} transparent="false" >
          <View style={styles.modal.topView}>
            <View style={styles.modal.topTextWrap}>
              <Text style={styles.modal.topText}>Send to Bitcoin Address or Import Private Key:</Text>
            </View>
            <View>
              <TextInput placeholder="Bitcoin Address or Private Key">

              </TextInput>
            </View>
          </View>
        </Modal>
      </View>
  }

}

export default connect( state => ({
  torchEnabled: state.scan.torchEnabled,
  addressModalVisible: state.scan.addressModalVisible
  })
)(Scan)
