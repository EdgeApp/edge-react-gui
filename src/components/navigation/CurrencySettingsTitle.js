// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import React from 'react'
import { Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { styles } from '../../styles/MainStyle.js'

type Props = {
  currencyInfo: EdgeCurrencyInfo,
  titleString?: string
}

export function CurrencySettingsTitle(props: Props) {
  const { currencyInfo, titleString = s.strings.title_crypto_settings } = props
  const { displayName, symbolImage = '' } = currencyInfo

  const title = sprintf(titleString, displayName)
  return (
    <View style={styles.titleWrapper}>
      <Image style={styles.titleImage} source={{ uri: symbolImage }} />
      <T style={styles.titleStyle}>{title}</T>
    </View>
  )
}
