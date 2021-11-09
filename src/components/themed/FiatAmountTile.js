// @flow
import * as React from 'react'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { FiatText } from './FiatText'
import { Tile } from './Tile.js'

type Props = {
  cryptoAmount: string | number,
  cryptoCurrencyCode: string,
  isoFiatCurrencyCode: string,
  title: string
}

export const FiatAmountTile = (props: Props) => {
  const { title, cryptoAmount, cryptoCurrencyCode, isoFiatCurrencyCode } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const fiatAmount = <FiatText cryptoAmount={cryptoAmount} cryptoCurrencyCode={cryptoCurrencyCode} isoFiatCurrencyCode={isoFiatCurrencyCode} />

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
