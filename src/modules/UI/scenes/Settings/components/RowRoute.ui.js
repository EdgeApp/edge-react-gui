// @flow

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'

import { border as b } from '../../../../utils'
import T from '../../../components/FormattedText'
import styles, { styles as styleRaw } from '../style'

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
        <View style={[styles.settingsRowTextRow, b('red')]}>
          <View style={[styles.settingsRowLeftContainer, b('blue')]}>
            <T style={[styles.settingsRowLeftText, b('green'), this.props.disabled ? styles.settingsRowLeftTextDisabled : null]}>{this.props.leftText}</T>
          </View>
          <View style={[styles.settingsRowLeftContainer, b('blue')]}>
            <T style={[styles.routeRowRightText, b('green')]}>{this.props.right}</T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
