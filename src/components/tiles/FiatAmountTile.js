// @flow
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile.js'

type Props = {
  title: string,

  // The amount to show:
  nativeCryptoAmount: string,
  tokenId?: string,
  wallet: EdgeCurrencyWallet,

  // Deprecated. Use `tokenId` instead:
  currencyCode?: string
}

export const FiatAmountTile = (props: Props) => {
  const { currencyCode, nativeCryptoAmount, title, tokenId, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Tile type="static" title={title} contentPadding={false} style={styles.tileContainer}>
      <EdgeText style={styles.tileBodyText}>
        <FiatText currencyCode={currencyCode} tokenId={tokenId} nativeCryptoAmount={nativeCryptoAmount} wallet={wallet} />
      </EdgeText>
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  tileBodyText: {
    fontSize: theme.rem(2)
  }
}))
