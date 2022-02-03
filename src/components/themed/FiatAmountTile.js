// @flow
import * as React from 'react'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { FiatText } from './FiatText'
import { Tile } from './Tile.js'

type Props = {
  nativeCryptoAmount: string,
  cryptoCurrencyCode: string,
  isoFiatCurrencyCode: string,
  title: string,
  cryptoExchangeMultiplier: string
}

export const FiatAmountTile = (props: Props) => {
  const { title, nativeCryptoAmount, cryptoCurrencyCode, isoFiatCurrencyCode, cryptoExchangeMultiplier } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const fiatAmount = (
    <FiatText
      nativeCryptoAmount={nativeCryptoAmount}
      cryptoCurrencyCode={cryptoCurrencyCode}
      isoFiatCurrencyCode={isoFiatCurrencyCode}
      cryptoExchangeMultiplier={cryptoExchangeMultiplier}
    />
  )

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
