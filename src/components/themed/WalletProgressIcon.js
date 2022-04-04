// @flow

import * as React from 'react'
import { View } from 'react-native'
import { AnimatedCircularProgress } from 'react-native-circular-progress'
import FastImage from 'react-native-fast-image'

import { useEffect, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { useTheme } from '../services/ThemeContext.js'

type Props = {
  // eslint-disable-next-line react/no-unused-prop-types
  walletId: string,
  // eslint-disable-next-line react/no-unused-prop-types
  currencyCode: string,
  size?: number
}

export const WalletProgressIcon = (props: Props) => {
  // const { walletId, currencyCode, size } = props
  const { walletId, size } = props
  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const [edgeWallets, setEdgeWallets] = useState(account.currencyWallets)
  const [edgeWallet, setEdgeWallet] = useState(edgeWallets[walletId])

  useEffect(
    () =>
      account.watch('currencyWallets', wallets => {
        setEdgeWallets(wallets)
        setEdgeWallet(wallets[walletId] ?? {})
      }),
    [account]
  )

  const [syncRatio, setSyncRatio] = useState(edgeWallet?.syncRatio ?? 0)
  useEffect(() => (edgeWallet != null ? edgeWallet.watch('syncRatio', setSyncRatio) : () => {}), [edgeWallet])

  const progress = syncRatio * 100
  const isDone = progress === 100

  let icon
  if (edgeWallet != null) {
    // TODO: fixme
    // const { builtinTokens, customTokens } = account.currencyConfig[edgeWallet.currencyInfo.pluginId]
    // let contractAddress = Object.values(builtinTokens).find(token => token.currencyCode === currencyCode).contractAddress
    icon = getCurrencyIcon(edgeWallet.currencyInfo.pluginId).symbolImage
  }

  const iconSize = {
    width: size || theme.rem(2),
    height: size || theme.rem(2)
  }

  let formattedProgress
  if (!icon) {
    formattedProgress = 0
  } else if (progress < 5) {
    formattedProgress = 5
  } else if (progress > 95 && progress < 100) {
    formattedProgress = 95
  } else {
    formattedProgress = progress
  }

  return (
    <AnimatedCircularProgress
      size={size ? size + theme.rem(0.25) : theme.rem(2.25)}
      width={theme.rem(3 / 16)}
      fill={formattedProgress}
      tintColor={isDone ? theme.walletProgressIconFillDone : theme.walletProgressIconFill}
      backgroundColor={theme.walletProgressIconBackground}
      rotation={0}
    >
      {() => (icon != null ? <FastImage style={iconSize} source={{ uri: icon }} /> : <View style={iconSize} />)}
    </AnimatedCircularProgress>
  )
}
