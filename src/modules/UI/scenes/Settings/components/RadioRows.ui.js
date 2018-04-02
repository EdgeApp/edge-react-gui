/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { View } from 'react-native'

export default class RadioRows extends Component {
  render () {
    return <View style={[{ height: 200 }]}>{this.props.children}</View>
  }
}
