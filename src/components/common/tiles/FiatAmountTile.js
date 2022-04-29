// @flow
import * as React from 'react'

import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { EdgeText } from '../../themed/EdgeText'
import { FiatText } from '../text/FiatText'
import { Tile } from './Tile.js'

type Props = {
  nativeCryptoAmount: string,
  title: string,
  tokenId: string,
  walletId: string
}

export const FiatAmountTile = (props: Props) => {
  const { nativeCryptoAmount, title, tokenId, walletId } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const fiatAmount = <FiatText format="raw" walletId={walletId} tokenId={tokenId} nativeCryptoAmount={nativeCryptoAmount} />

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
