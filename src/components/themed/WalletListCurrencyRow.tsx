import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { memo } from '../../types/reactHooks'
import { CurrencyRow } from '../data/row/CurrencyRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

type Props = {
  showRate?: boolean
  token?: EdgeToken
  tokenId?: string
  wallet: EdgeCurrencyWallet

  // Callbacks:
  onLongPress?: () => void
  onPress?: (walletId: string, currencyCode: string, tokenId?: string) => void
}

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
    if (onPress != null) onPress(wallet.id, currencyCode, tokenId)
  })

  return (
    <TouchableOpacity style={styles.row} onLongPress={onLongPress} onPress={handlePress}>
      <CurrencyRow showRate={showRate} token={token} tokenId={tokenId} wallet={wallet} />
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25),
    marginLeft: theme.rem(0.5)
  }
}))

export const WalletListCurrencyRow = memo(WalletListCurrencyRowComponent)
