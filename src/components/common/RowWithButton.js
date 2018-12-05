// @flow

import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import T from '../../modules/UI/components/FormattedText/index'
import styles, { styles as styleRaw } from '../../styles/scenes/SettingsStyle'

type Props = {
  logo: string,
  leftText: string,
  rightText: string,
  onToggle(): void
}
class RowWithButton extends Component<Props> {
  constructor (props: Props) {
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
        onPress={() => this._onPressToggleSetting()}
      >
        <View style={[styles.settingsRowTextRow]}>
          <View style={[styles.settingsRowLeftContainer]}>
            <Image resizeMode={'contain'} style={styles.settingsRowLeftLogo} source={this.props.logo} />
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

export { RowWithButton }
