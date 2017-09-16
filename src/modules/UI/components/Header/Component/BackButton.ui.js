import React, {Component} from 'react'
import {TouchableOpacity} from 'react-native'
import T from '../../../components/FormattedText'
import styles from '../style'

export default class BackButton extends Component {
  render () {
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <T style={[styles.sideText]}>{this.props.label}</T>
      </TouchableOpacity>
    )
  }
}
