// @flow
import React, { Component } from 'react'
import { Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import styles from '../../styles/scenes/SettingsStyle.js'

export type CurrencySettingsTitleOwnProps = {
  pluginName: string
}
export type CurrencySettingsTitleStateProps = {
  logo: string
}
export type CurrencySettingsTitleComponentProps = CurrencySettingsTitleStateProps & CurrencySettingsTitleOwnProps
export class CurrencySettingsTitle extends Component<CurrencySettingsTitleComponentProps> {
  render () {
    const { pluginName, logo } = this.props
    const capitalizedPluginName = pluginName.charAt(0).toUpperCase() + pluginName.substr(1)
    const title = sprintf(s.strings.title_crypto_settings, capitalizedPluginName)
    return (
      <View style={{ flexDirection: 'row' }}>
        <Image style={{ height: 25, width: 25, resizeMode: Image.resizeMode.contain }} source={{ uri: logo }} />
        <T style={styles.titleStyle}>{title || ''}</T>
      </View>
    )
  }
}
