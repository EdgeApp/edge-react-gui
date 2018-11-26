/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import T from '../../modules/UI/components/FormattedText/index'
import styles, { styles as styleRaw } from '../../styles/scenes/SettingsStyle'

export default class RowWithButton extends Component {
  constructor (props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  _onPressToggleSetting = () => {
    this.props.onToggle()
  }

  render () {
    return (
      <TouchableHighlight
        style={[styles.settingsRowContainer]}
        underlayColor={styleRaw.underlay.color}
        disabled={false}
        onPress={() => this._onPressToggleSetting(this.props.property)}
      >
        <View style={[styles.settingsRowTextRow]}>
          <View style={[styles.settingsRowLeftContainer]}>
            {this.props.logo}
            <T style={[styles.settingsRowLeftText]}>{this.props.leftText}</T>
          </View>
          <View style={styles.settingsRowRightContainer}>
            <T style={[styles.settingsRowLeftText]}>{this.props.rightText}</T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

RowWithButton.defaultProps = {
  value: false
}
