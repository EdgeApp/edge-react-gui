// @flow
import * as React from 'react'

import { MAX_CRYPTO_AMOUNT_CHARACTERS } from '../../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../../locales/intl.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { FiatText } from './FiatText'
import { Tile } from './Tile.js'

type Props = {
  cryptoAmount: string | number,
  cryptoCurrencyCode: string,
  isoFiatCurrencyCode: string,
  maxCryptoChars?: number,
  title: string
}

export const CryptoFiatAmountTile = (props: Props) => {
  const { title, cryptoAmount, cryptoCurrencyCode, isoFiatCurrencyCode, maxCryptoChars } = props
  const styles = getStyles(useTheme())
  // Default to 10 displayed chars for crypto amount
  const fmtCryptoAmount = formatNumber(cryptoAmount, { toFixed: maxCryptoChars === undefined ? MAX_CRYPTO_AMOUNT_CHARACTERS : maxCryptoChars })
  const cryptoAmountText = `${fmtCryptoAmount} ${cryptoCurrencyCode} `
  // Fiat amount is always positive for this specific tile
  const absCryptoAmount = Math.abs(parseFloat(cryptoAmount))
  const fiatAmount = (
    <FiatText cryptoAmount={absCryptoAmount} cryptoCurrencyCode={cryptoCurrencyCode} isoFiatCurrencyCode={isoFiatCurrencyCode} parenthesisEnclosed />
  )

  return (
    <Tile type="static" title={title} contentPadding={false} style={styles.tileContainer}>
      <EdgeText>
        {cryptoAmountText}
        {fiatAmount}
      </EdgeText>
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  }
}))
