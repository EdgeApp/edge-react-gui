// @flow

import React, { Component } from 'react'
import { View, Image } from 'react-native'
import type { EdgeCurrencyPlugin } from 'edge-core-js'
import T from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import { sprintf } from 'sprintf-js'
import styles from './style.js'

export type CurrencySettingsTitleOwnProps = {
  pluginName: string
}

export type CurrencySettingsTitleStateProps = {
  plugin: EdgeCurrencyPlugin
}

export type CurrencySettingsTitleComponentProps = CurrencySettingsTitleStateProps & CurrencySettingsTitleOwnProps

export class CurrencySettingsTitle extends Component<CurrencySettingsTitleComponentProps> {
  render () {
    const { pluginName } = this.props
    let logo
    if (this.props.plugin && this.props.plugin.currencyInfo) {
      logo = this.props.plugin.currencyInfo.symbolImage
    } else {
      logo = ''
    }
    const title = sprintf(s.strings.title_crypto_settings, pluginName)
    return (
      <View style={{flexDirection: 'row'}}>
        <Image style={{ height: 25, width: 25, resizeMode: Image.resizeMode.contain }} source={{ uri: logo }} />
        <T style={styles.titleStyle}>{title || ''}</T>
      </View>
    )
  }
}
