/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'

import FormattedText from '../FormattedText'
import styles, { styles as styleRaw } from './styles'

export default class ShareButton extends Component {
  render () {
    const { displayName, onPress, style, border } = this.props
    return (
      <TouchableHighlight style={[styles.shareButton, style]} underlayColor={styleRaw.underlay.color} onPress={onPress}>
        <View style={styles.outerView}>
          <View style={[styles.view, border]}>
            <FormattedText style={styles.text}>{displayName}</FormattedText>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
