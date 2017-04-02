import React, {  Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import Camera from 'react-native-camera'

class Send extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: 0
    }
  }

  updateInputField = (value) => {
    this.setState({
      value: value
    })
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
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center'
  }
})

export default connect()(Send)
