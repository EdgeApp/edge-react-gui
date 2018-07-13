// @flow

import React, { Component } from 'react'
import { View, Image } from 'react-native'
import T from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import styles from './style.js'

export type CurrencySettingsTitleOwnProps = {
  pluginName: string
}

export type CurrencySettingsTitleStateProps = {
  plugins: Object
}

export type CurrencySettingsTitleComponentProps = CurrencySettingsTitleStateProps & CurrencySettingsTitleOwnProps

export class CurrencySettingsTitle extends Component<CurrencySettingsTitleComponentProps> {
  render () {
    const { pluginName } = this.props
    let logo
    if (this.props.plugins) {
      logo = this.props.plugins[pluginName.toLowerCase()].currencyInfo.symbolImage
    } else {
      logo = ''
    }
    const title = s.strings[`title_${pluginName}_settings`]
    return (
      <View style={{flexDirection: 'row'}}>
        <Image style={{ height: 25, width: 25, resizeMode: Image.resizeMode.contain }} source={{ uri: logo }} />
        <T style={styles.titleStyle}>{title || ''}</T>
      </View>
    )
  }
}
