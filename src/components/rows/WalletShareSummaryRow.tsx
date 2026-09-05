import type { EdgeCurrencyWallet, EdgeWalletShareMode } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useWalletName } from '../../hooks/useWalletName'
import { lstrings } from '../../locales/strings'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { WalletShareTokenRows } from './WalletShareTokenRows'

interface Props {
  wallet: EdgeCurrencyWallet
  mode: EdgeWalletShareMode
  /** Suppress the divider under the last row. */
  isLast?: boolean
}

/**
 * A flat, non-interactive wallet row with its share mode on the right, and
 * the wallet's tokens indented beneath it. "Spend" is called out in the
 * warning color because it is the irreversible grant; "View only" stays
 * quiet.
 */
const WalletShareSummaryRowComponent: React.FC<Props> = props => {
  const { wallet, mode, isLast = false } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const walletName = useWalletName(wallet)
  const { currencyCode, pluginId } = wallet.currencyInfo

  return (
    <View style={isLast ? styles.containerLast : styles.container}>
      <View style={styles.row}>
        <CryptoIcon pluginId={pluginId} tokenId={null} sizeRem={2} />
        <View style={styles.textColumn}>
          <EdgeText style={styles.currencyCode}>{currencyCode}</EdgeText>
          <EdgeText style={styles.walletName}>{walletName}</EdgeText>
        </View>
        <EdgeText style={mode === 'spend' ? styles.modeSpend : styles.modeView}>
          {mode === 'spend'
            ? lstrings.wallet_share_mode_spend
            : lstrings.wallet_share_mode_view_only}
        </EdgeText>
      </View>
      <WalletShareTokenRows wallet={wallet} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const container = {
    paddingVertical: theme.rem(0.75),
    marginHorizontal: theme.rem(0.5),
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  }
  return {
    container,
    containerLast: { ...container, borderBottomWidth: 0 },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const
    },
    textColumn: {
      flexGrow: 1,
      flexShrink: 1,
      marginLeft: theme.rem(0.5),
      marginRight: theme.rem(0.5)
    },
    currencyCode: {
      fontFamily: theme.fontFaceMedium
    },
    walletName: {
      fontSize: theme.rem(0.75),
      color: theme.secondaryText
    },
    modeView: {
      fontSize: theme.rem(0.75),
      color: theme.secondaryText
    },
    modeSpend: {
      fontSize: theme.rem(0.75),
      fontFamily: theme.fontFaceMedium,
      color: theme.warningText
    }
  }
})

export const WalletShareSummaryRow = React.memo(WalletShareSummaryRowComponent)
