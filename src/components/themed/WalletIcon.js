// @flow

import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { SMALL_ICON_RATIO } from '../../constants/constantSettings.js'
import { useTheme } from '../services/ThemeContext.js'

type Props = {
  walletIcon?: string,
  tokenIcon?: string,
  size?: number
}

export const WalletIcon = (props: Props) => {
  const theme = useTheme()
  const { walletIcon, tokenIcon, size = theme.rem(2) } = props
  const getIconSize = (multiplier = 1) => ({ width: size * multiplier, height: size * multiplier })

  return (
    <View>
      {walletIcon != null ? <FastImage style={getIconSize()} source={{ uri: tokenIcon ?? walletIcon }} /> : <View style={getIconSize(size)} />}
      {tokenIcon != null ? (
        <FastImage style={{ position: 'absolute', bottom: 0, right: 0, ...getIconSize(SMALL_ICON_RATIO) }} source={{ uri: walletIcon }} />
      ) : null}
    </View>
  )
}
