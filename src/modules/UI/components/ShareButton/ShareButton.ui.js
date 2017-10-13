import React, {Component} from 'react'
import {
  View,
  TouchableOpacity
} from 'react-native'
import FormattedText from '../FormattedText'

import styles from './styles'

export default class ShareButton extends Component {
  render () {
    const {
      displayName,
      onPress,
      style,
      border
    } = this.props
    return <TouchableOpacity style={[styles.shareButton, style]}
      onPress={onPress} activeOpacity={0.2}>
      <View style={[styles.outerView]}>
        <View style={[styles.view, border]}>
          <FormattedText style={[styles.text]}>{displayName}</FormattedText>
        </View>
      </View>
    </TouchableOpacity>
  }
}
