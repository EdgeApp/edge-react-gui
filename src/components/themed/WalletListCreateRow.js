// @flow

import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { createAndSelectToken, createAndSelectWallet } from '../../actions/CreateWalletActions'
import s from '../../locales/strings.js'
import { memo, useCallback, useMemo } from '../../types/reactHooks.js'
import { useDispatch } from '../../types/reactRedux.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletListRow } from './WalletListRow.js'

export type WalletListCreateRowProps = {
  currencyCode: string,
  currencyName: string,
  walletType?: string,
  symbolImage?: string,
  symbolImageDarkMono?: string,
  parentCurrencyCode?: string
}

export const WalletListCreateRow = memo((props: WalletListCreateRowProps) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { currencyCode = '', currencyName = '', walletType, symbolImage = '', symbolImageDarkMono = '', parentCurrencyCode } = props

  const handlePress = useCallback(() => {
    if (walletType != null) dispatch(createAndSelectWallet({ walletType }))
    if (parentCurrencyCode != null) dispatch(createAndSelectToken({ currencyCode, parentCurrencyCode }))
  }, [walletType, parentCurrencyCode, dispatch, currencyCode])

  const icon = useMemo(
    () => <FastImage style={styles.iconSize} source={{ uri: symbolImage ?? symbolImageDarkMono }} />,
    [styles.iconSize, symbolImage, symbolImageDarkMono]
  )

  return (
    <WalletListRow currencyCode={currencyCode} icon={icon} onPress={handlePress} walletName={currencyName}>
      <View style={styles.labelContainer}>
        <EdgeText style={styles.labelText}>{walletType != null ? s.strings.fragment_create_wallet_create_wallet : s.strings.wallet_list_add_token}</EdgeText>
      </View>
    </WalletListRow>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  // Icons
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },

  // Label
  labelContainer: { justifyContent: 'center' },
  labelText: { fontFamily: theme.fontFaceMedium }
}))
