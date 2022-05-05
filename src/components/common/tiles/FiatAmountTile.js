// @flow
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { EdgeText } from '../../themed/EdgeText'
import { FiatText } from '../text/FiatText'
import { Tile } from './Tile.js'

type Props = {
  currencyCode?: string,
  nativeCryptoAmount: string,
  title: string,
  tokenId?: string,
  wallet: EdgeCurrencyWallet
}

export const FiatAmountTile = (props: Props) => {
  const { currencyCode, nativeCryptoAmount, title, tokenId, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const fiatAmount = <FiatText currencyCode={currencyCode} tokenId={tokenId} nativeCryptoAmount={nativeCryptoAmount} wallet={wallet} noFiatSymbol />

  return (
    <Tile type="static" title={title} contentPadding={false} style={styles.tileContainer}>
      <EdgeText style={styles.tileBodyText}>{fiatAmount}</EdgeText>
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
