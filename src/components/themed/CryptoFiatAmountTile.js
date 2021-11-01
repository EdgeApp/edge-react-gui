// @flow
import * as React from 'react'
import { formatNumber } from '../../locales/intl.js'

import { MAX_CRYPTO_AMOUNT_CHARACTERS } from "../../constants/WalletAndCurrencyConstants.js";
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { FiatText } from './FiatText'
import { Tile } from './Tile.js'

type OwnProps = {
  cryptoAmount: string | number,
  cryptoCurrencyCode: string,
  isoFiatCurrencyCode: string,
  maxCryptoChars?: number,
  title: string
}

type Props = OwnProps & ThemeProps

class CryptoFiatAmountTileComponent extends React.PureComponent<Props> {
  render() {
    const { theme, title, cryptoAmount, cryptoCurrencyCode, isoFiatCurrencyCode, maxCryptoChars } = this.props
    const styles = getStyles(theme)

    // Default to 10 displayed chars for crypto amount
    const fmtCryptoAmount =  formatNumber(cryptoAmount, {toFixed: (maxCryptoChars === undefined ? MAX_CRYPTO_AMOUNT_CHARACTERS : maxCryptoChars)})

    // Fiat amount is always positive for this specific tile
    const absCryptoAmount = Math.abs(parseFloat(cryptoAmount))
    const fiatAmount = (
      <FiatText cryptoAmount={absCryptoAmount} cryptoCurrencyCode={cryptoCurrencyCode} isoFiatCurrencyCode={isoFiatCurrencyCode} parenthesisEnclosed />
    )

    return (
      <Tile type="static" title={title} contentPadding={false} style={styles.tileContainer}>
        <EdgeText>
          {`${fmtCryptoAmount} ${cryptoCurrencyCode} `}
          {fiatAmount}{``/* Empty string added here to satisfy compiler complaints */}
        </EdgeText>
      </Tile>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  }
}))

export const CryptoFiatAmountTile = withTheme(CryptoFiatAmountTileComponent)
