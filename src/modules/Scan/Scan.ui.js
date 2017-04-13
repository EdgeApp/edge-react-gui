import React, {  Component } from 'react'
import { StyleSheet, Text, View, TouchableHighlight } from 'react-native'
import { connect } from 'react-redux'
import Camera from 'react-native-camera'
import styles from './Scan.style'

class Scan extends Component {
  constructor (props) {
    super(props)
  }

  _onToggleTorch() {
    console.log('toggling torch')
  }

  onBarCodeRead () {
    console.log('in send->onBarCodeRead')
  }

  render () {
    return (
      <View style={styles.container}>
        <Camera
          style={styles.preview}
          barCodeTypes={["qr"]}
          onBarCodeRead={this.onBarCodeRead}
        />
        <View style={[styles.overlay]}>
          <View style={[styles.overlayTop]}>
            <Text style={styles.overlayTopText}>Scan, to Send, Import, or Edge Login</Text>
          </View>
          <View style={[styles.overlayBlank]}></View>
          <View style={[styles.overlayButtonAreaWrap]}>
              <TouchableHighlight style={[styles.transferButtonWrap]}><Text style={styles.transferButtonText}>Transfer</Text></TouchableHighlight>
              <TouchableHighlight style={[styles.addressButtonWrap]}><Text style={styles.addressButtonText}>Address</Text></TouchableHighlight>
              <TouchableHighlight style={[styles.photosButtonWrap]}><Text style={styles.photosButtonText}>Photos</Text></TouchableHighlight>
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
}

export default connect( state => ({
  torchEnabled: state.scan.torchEnabled
  })
)(Scan)
