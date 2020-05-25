// @flow

import React, { PureComponent } from 'react'
import { StyleSheet, TouchableHighlight, View } from 'react-native'

import FormattedText from '../FormattedText'
import styles, { styles as styleRaw } from './styles'

export type Props = {
  displayName: string,
  onPress: () => void,
  style?: StyleSheet.Styles,
  border?: StyleSheet.Styles
}
export class ShareButton extends PureComponent<Props> {
  render() {
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

export default ShareButton
