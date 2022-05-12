// @flow
import { div, toFixed } from 'biggystring'
import { wrap } from 'cavy'
import { type EdgeCurrencyWallet, type EdgeDenomination } from 'edge-core-js'
import * as React from 'react'

import s from '../../locales/strings.js'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors.js'
import { type GuiExchangeRates } from '../../types/types.js'
import { getWalletFiat } from '../../util/CurrencyWalletHelpers.js'
import { DECIMAL_PRECISION, getDenomFromIsoCode, zeroString } from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile.js'

type Props = {
  title: string,
  exchangeRates: GuiExchangeRates,
  nativeAmount: string,
  currencyWallet: EdgeCurrencyWallet,
  currencyCode: string,
  exchangeDenomination: EdgeDenomination,
  displayDenomination: EdgeDenomination,
  lockInputs: boolean,
  onPress: () => void
}

export const EditableAmountTileComponent = (props: Props) => {
  let cryptoAmountSyntax
  let cryptoAmountStyle
  let fiatAmountSyntax
  const { title, exchangeRates, nativeAmount, currencyWallet, currencyCode, exchangeDenomination, displayDenomination, lockInputs, onPress } = props
  const { isoFiatCurrencyCode } = getWalletFiat(currencyWallet)
  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)
  const fiatSymbol = fiatDenomination.symbol ? fiatDenomination.symbol : ''
  const theme = useTheme()
  const styles = getStyles(theme)
  if (nativeAmount === '' && !lockInputs) {
    cryptoAmountSyntax = s.strings.string_tap_to_edit
    cryptoAmountStyle = styles.amountTextMuted
  } else if (!zeroString(nativeAmount)) {
    const displayAmount = div(nativeAmount, displayDenomination.multiplier, DECIMAL_PRECISION)
    const exchangeAmount = div(nativeAmount, exchangeDenomination.multiplier, DECIMAL_PRECISION)
    const fiatAmount = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, isoFiatCurrencyCode, exchangeAmount)
    cryptoAmountSyntax = `${displayAmount ?? '0'} ${displayDenomination.name}`
    if (fiatAmount) {
      fiatAmountSyntax = `${fiatSymbol} ${toFixed(fiatAmount, 2, 2) ?? '0'}`
    }
  } else {
    cryptoAmountSyntax = `0 ${displayDenomination.name}`
  }

  return (
    <Tile type={lockInputs ? 'static' : 'editable'} title={title} onPress={lockInputs ? undefined : onPress}>
      <EdgeText style={[styles.amountText, cryptoAmountStyle]} minimumFontScale={0.3}>
        {cryptoAmountSyntax}
      </EdgeText>
      {fiatAmountSyntax == null ? null : <EdgeText>{fiatAmountSyntax}</EdgeText>}
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  amountText: {
    fontSize: theme.rem(2)
  },
  amountTextMuted: {
    color: theme.deactivatedText
  }
}))
export const EditableAmountTile = wrap(EditableAmountTileComponent)
