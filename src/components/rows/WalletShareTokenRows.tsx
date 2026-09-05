import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  wallet: EdgeCurrencyWallet
}

/** Tokens listed in full before the rest collapse into a count. */
const MAX_ROWS = 5

/**
 * A wallet's enabled tokens, indented beneath it and inert. Tokens have no
 * mode of their own: sharing hands over the wallet's keys, and everything
 * that wallet holds comes with them.
 */
const WalletShareTokenRowsComponent: React.FC<Props> = props => {
  const { wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const enabledTokenIds = useWatch(wallet, 'enabledTokenIds')
  const allTokens = useWatch(wallet.currencyConfig, 'allTokens')
  const { pluginId } = wallet.currencyInfo

  // A token the plugin no longer knows about has nothing to show, so it is
  // dropped rather than listed as a blank row:
  const known = enabledTokenIds.filter(tokenId => allTokens[tokenId] != null)
  const shown = known.slice(0, MAX_ROWS)
  const hidden = known.length - shown.length

  if (known.length === 0) return null
  return (
    <View style={styles.list}>
      {shown.map(tokenId => (
        <View key={tokenId} style={styles.row}>
          <CryptoIcon pluginId={pluginId} tokenId={tokenId} sizeRem={1} />
          <EdgeText style={styles.currencyCode}>
            {allTokens[tokenId].currencyCode}
          </EdgeText>
          <EdgeText style={styles.displayName} numberOfLines={1}>
            {allTokens[tokenId].displayName}
          </EdgeText>
        </View>
      ))}
      {hidden === 0 ? null : (
        <EdgeText style={styles.more}>
          {sprintf(lstrings.wallet_share_tokens_more_1s, String(hidden))}
        </EdgeText>
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    marginLeft: theme.rem(2),
    marginBottom: theme.rem(0.25)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.rem(0.25)
  },
  currencyCode: {
    fontSize: theme.rem(0.75),
    marginLeft: theme.rem(0.5)
  },
  displayName: {
    flexShrink: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginLeft: theme.rem(0.5)
  },
  more: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginTop: theme.rem(0.25),
    marginLeft: theme.rem(1.5)
  }
}))

export const WalletShareTokenRows = React.memo(WalletShareTokenRowsComponent)
