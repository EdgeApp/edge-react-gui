// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import React from 'react'
import { Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { styles } from '../../styles/MainStyle.js'

type Props = {
  currencyInfo: EdgeCurrencyInfo
}

export function CurrencySettingsTitle(props: Props) {
  const { currencyInfo } = props
  const { displayName, symbolImage = '' } = currencyInfo

  const title = sprintf(s.strings.title_crypto_settings, displayName)
  return (
    <View style={styles.titleWrapper}>
      <Image style={styles.titleImage} source={{ uri: symbolImage }} />
      <T style={styles.titleStyle}>{title}</T>
    </View>
  )
}
