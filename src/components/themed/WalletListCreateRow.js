// @flow

import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { createAndSelectToken, createAndSelectWallet } from '../../actions/CreateWalletActions'
import s from '../../locales/strings.js'
import { memo, useCallback } from '../../types/reactHooks.js'
import { useDispatch } from '../../types/reactRedux.js'
import type { CreateTokenType, CreateWalletType } from '../../types/types.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletListRow } from './WalletListRow.js'

type Props = {
  createWalletType?: CreateWalletType,
  createTokenType?: CreateTokenType
}

export const WalletListCreateRow = memo((props: Props) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { createWalletType, createTokenType } = props
  const { symbolImage = '', currencyCode = '', currencyName = '' } = createWalletType ?? createTokenType ?? {}

  const handlePress = useCallback(() => {
    if (createWalletType != null) {
      dispatch(createAndSelectWallet({ ...createWalletType }))
    } else if (createTokenType != null) {
      dispatch(createAndSelectToken(createTokenType))
    }
  }, [createWalletType, createTokenType, dispatch])

  return (
    <WalletListRow
      currencyCode={currencyCode}
      icon={<FastImage style={styles.iconSize} source={{ uri: symbolImage }} />}
      onPress={handlePress}
      walletName={currencyName}
    >
      <View style={styles.labelContainer}>
        <EdgeText style={styles.labelText}>
          {createWalletType != null ? s.strings.fragment_create_wallet_create_wallet : s.strings.wallet_list_add_token}
        </EdgeText>
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
