import React, {Component} from 'react'
import {View} from 'react-native'

class RadioRows extends Component {
  render () {
    return (
      <View style={[{height: 200}]}>
        {this.props.children}
      </View>
    )
  }
}

export default RadioRows
