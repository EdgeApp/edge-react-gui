// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'

import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'

type Props = {
  currencyInfo: EdgeCurrencyInfo
}

export function CurrencySettingsTitle(props: Props) {
  const { displayName, symbolImage = '' } = props.currencyInfo
  return (
    <View style={styles.titleWrapper}>
      <Image style={styles.titleImage} source={{ uri: symbolImage }} />
      <T numberOfLines={1} style={styles.titleStyle}>
        {displayName}
      </T>
    </View>
  )
}

const rawStyles = {
  titleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: THEME.rem(0.75)
  },
  titleImage: {
    height: THEME.rem(1.5),
    width: THEME.rem(1.5),
    marginRight: THEME.rem(0.5),
    resizeMode: 'contain'
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: THEME.rem(1.25),
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  }
}
const styles = StyleSheet.create(rawStyles)
