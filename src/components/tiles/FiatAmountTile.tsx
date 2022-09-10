import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile'

type Props = {
  title: string

  // The amount to show:
  nativeCryptoAmount: string
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

export const FiatAmountTile = (props: Props) => {
  const { nativeCryptoAmount, title, tokenId, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Tile type="static" title={title} contentPadding={false} style={styles.tileContainer}>
      <EdgeText style={styles.tileBodyText}>
        <FiatText tokenId={tokenId} nativeCryptoAmount={nativeCryptoAmount} wallet={wallet} />
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
