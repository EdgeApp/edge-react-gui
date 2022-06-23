// @flow
import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { useHandler } from '../../hooks/useHandler.js'
import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyGroup } from '../shared/CurrencyGroup.js'

type Props = {|
  showRate?: boolean,
  token?: EdgeToken,
  tokenId?: string,
  wallet: EdgeCurrencyWallet,

  // Callbacks:
  onLongPress?: () => void,
  onPress?: (walletId: string, currencyCode: string) => void
|}

const WalletListCurrencyRowComponent = (props: Props) => {
  const {
    showRate = false,
    token,
    tokenId,
    wallet,

    // Callbacks:
    onLongPress,
    onPress
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // Currency code and wallet name for display:
  const { currencyCode } = token == null ? wallet.currencyInfo : token

  const handlePress = useHandler(() => {
    if (onPress != null) onPress(wallet.id, currencyCode)
  })

  return (
    <TouchableOpacity style={styles.row} onLongPress={onLongPress} onPress={handlePress}>
      <CurrencyGroup showRate={showRate} token={token} tokenId={tokenId} wallet={wallet} />
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  }
}))

export const WalletListCurrencyRow = memo(WalletListCurrencyRowComponent)
