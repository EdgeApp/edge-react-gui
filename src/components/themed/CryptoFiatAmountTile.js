// @flow
import { bns } from 'biggystring'
import * as React from 'react'

import { MAX_CRYPTO_AMOUNT_CHARACTERS } from '../../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../../locales/intl.js'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { DECIMAL_PRECISION } from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { FiatText } from './FiatText'
import { Tile } from './Tile.js'

type Props = {
  cryptoAmount: string,
  cryptoCurrencyCode: string,
  isoFiatCurrencyCode: string,
  maxCryptoChars?: number,
  title: string
}

export const CryptoFiatAmountTile = (props: Props) => {
  const { title, cryptoAmount, cryptoCurrencyCode, isoFiatCurrencyCode, maxCryptoChars } = props
  const styles = getStyles(useTheme())

  const { cryptoName, cryptoMultiplier } = useSelector(state => {
    const { name, multiplier } = getDisplayDenomination(state, cryptoCurrencyCode)
    return { cryptoName: name, cryptoMultiplier: multiplier }
  })
  // Default to 10 displayed chars for crypto amount
  const cryptoAmountDenom = bns.div(cryptoAmount, cryptoMultiplier, DECIMAL_PRECISION)
  const fmtCryptoAmount = formatNumber(cryptoAmountDenom, { toFixed: maxCryptoChars === undefined ? MAX_CRYPTO_AMOUNT_CHARACTERS : maxCryptoChars })
  const cryptoAmountText = `${fmtCryptoAmount} ${cryptoName} `
  // Fiat amount is always positive for this specific tile
  const absCryptoAmount = bns.abs(cryptoAmount)
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
