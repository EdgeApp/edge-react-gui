import { div, round, toFixed } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors'
import { GuiExchangeRates } from '../../types/types'
import { getWalletFiat } from '../../util/CurrencyWalletHelpers'
import { DECIMAL_PRECISION, getDenomFromIsoCode, zeroString } from '../../util/utils'
import { EdgeAnim } from '../common/EdgeAnim'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { RowUi4 } from '../ui4/RowUi4'

interface Props {
  title: string
  exchangeRates: GuiExchangeRates
  nativeAmount: string
  wallet: EdgeCurrencyWallet
  currencyCode: string
  exchangeDenomination: EdgeDenomination
  displayDenomination: EdgeDenomination
  lockInputs: boolean
  compressed?: boolean
  onPress: () => void
}

export const EditableAmountTile = (props: Props) => {
  let cryptoAmountSyntax
  let cryptoAmountStyle
  let fiatAmountSyntax
  const { title, exchangeRates, nativeAmount, wallet, currencyCode, exchangeDenomination, displayDenomination, lockInputs, onPress, compressed = false } = props
  const { isoFiatCurrencyCode } = getWalletFiat(wallet)
  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)
  const fiatSymbol = fiatDenomination.symbol ? fiatDenomination.symbol : ''
  const theme = useTheme()
  const styles = getStyles(theme)
  if (nativeAmount === '' && !lockInputs) {
    cryptoAmountSyntax = lstrings.string_tap_to_edit
    cryptoAmountStyle = styles.amountTextMuted
  } else if (!zeroString(nativeAmount)) {
    const displayAmount = div(nativeAmount, displayDenomination.multiplier, DECIMAL_PRECISION)
    const exchangeAmount = div(nativeAmount, exchangeDenomination.multiplier, DECIMAL_PRECISION)
    const fiatAmount = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, isoFiatCurrencyCode, exchangeAmount)
    cryptoAmountSyntax = `${displayAmount ?? '0'} ${displayDenomination.name}`
    if (fiatAmount) {
      fiatAmountSyntax = `${fiatSymbol} ${toFixed(round(fiatAmount, -2), 2, 2) ?? '0'}`
    }
  } else {
    cryptoAmountSyntax = `0 ${displayDenomination.name}`
  }

  const key = `${cryptoAmountSyntax}-${title}`

  if (compressed) {
    return (
      <EdgeAnim key={key} enter={{ type: 'stretchInY' }} exit={{ type: 'stretchOutY' }}>
        <RowUi4 rightButtonType={lockInputs ? 'none' : 'delete'} title={title} body={`Amount: ${cryptoAmountSyntax} (${fiatAmountSyntax})`} onPress={onPress} />
      </EdgeAnim>
    )
  } else {
    return (
      <EdgeAnim key={key} enter={{ type: 'stretchInY' }} exit={{ type: 'stretchOutY' }}>
        <RowUi4 rightButtonType={lockInputs ? 'none' : 'editable'} title={title} onPress={lockInputs ? undefined : onPress}>
          <EdgeText style={[styles.amountText, cryptoAmountStyle]} minimumFontScale={0.3}>
            {cryptoAmountSyntax}
          </EdgeText>
          {fiatAmountSyntax == null ? null : <EdgeText>{fiatAmountSyntax}</EdgeText>}
        </RowUi4>
      </EdgeAnim>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  amountText: {
    fontSize: theme.rem(2)
  },
  amountTextMuted: {
    color: theme.deactivatedText
  }
}))
