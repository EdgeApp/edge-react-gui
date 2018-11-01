// @flow

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'

import T from '../../modules/UI/components/FormattedText/index'
import styles, { styles as styleRaw } from '../../styles/scenes/SettingsStyle'

type Props = {
  leftText: string,
  disabled: boolean,
  right?: any,
  routeFunction(): void
}

export default class RowRoute extends Component<Props> {
  render () {
    return (
      <TouchableHighlight style={[styles.settingsRowContainer]} underlayColor={styleRaw.underlay.color} disabled={false} onPress={this.props.routeFunction}>
        <View style={[styles.settingsRowTextRow]}>
          <View style={[styles.settingsRowLeftContainer]}>
            <T style={[styles.settingsRowLeftText, this.props.disabled ? styles.settingsRowLeftTextDisabled : null]}>{this.props.leftText}</T>
          </View>
          <View style={[styles.settingsRowLeftContainer]}>
            <T style={[styles.routeRowRightText]}>{this.props.right}</T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
