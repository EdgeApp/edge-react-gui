/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'

import { border as b } from '../../../../utils'
import T from '../../../components/FormattedText'
import styles, { styles as styleRaw } from '../style'

export default class RowModal extends Component {
  render () {
    return (
      <TouchableHighlight style={[styles.settingsRowContainer]} disabled={false} underlayColor={styleRaw.underlay.color} onPress={this.props.onPress}>
        <View style={[styles.settingsRowTextRow, b('red')]}>
          <View style={[styles.settingsRowLeftContainer, b('blue')]}>
            <T style={[styles.settingsRowLeftText, b('green')]}>{this.props.leftText}</T>
          </View>

          <T style={styles.modalRightText}>{this.props.rightText}</T>
        </View>
      </TouchableHighlight>
    )
  }
}
