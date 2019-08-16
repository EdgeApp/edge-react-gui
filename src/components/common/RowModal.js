// @flow

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import T from '../../modules/UI/components/FormattedText/index'
import styles, { styles as styleRaw } from '../../styles/scenes/SettingsStyle'

export type Props = {
  leftText: string,
  rightText: string,
  onPress: () => mixed,
  disabled?: boolean
}
export default class RowModal extends Component<Props> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }
  static defaultProps = {
    leftText: '',
    rightText: '',
    onPress: () => {}
  }
  render () {
    return (
      <TouchableHighlight
        style={[styles.settingsRowContainer]}
        disabled={this.props.disabled || false}
        underlayColor={styleRaw.underlay.color}
        onPress={this.props.onPress}
      >
        <View style={styles.settingsRowTextRow}>
          <View style={styles.settingsRowLeftContainer}>
            <T style={styles.settingsRowLeftText}>{this.props.leftText}</T>
          </View>

          <T style={styles.modalRightText}>{this.props.rightText}</T>
        </View>
      </TouchableHighlight>
    )
  }
}
