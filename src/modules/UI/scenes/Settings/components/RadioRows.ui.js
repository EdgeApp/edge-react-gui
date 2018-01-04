import React, {Component} from 'react'
import {
  View
} from 'react-native'

export default class RadioRows extends Component {
  render () {
    return (
      <View>
        {this.props.children}
      </View>
    )
  }
}
