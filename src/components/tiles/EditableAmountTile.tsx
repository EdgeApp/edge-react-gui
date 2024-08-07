import { div, round, toFixed } from 'biggystring'
import { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { GuiExchangeRates } from '../../types/types'
import { convertCurrencyFromExchangeRates, DECIMAL_PRECISION, getDenomFromIsoCode, zeroString } from '../../util/utils'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  title: string
  exchangeRates: GuiExchangeRates
  nativeAmount: string
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
  const { title, exchangeRates, nativeAmount, currencyCode, exchangeDenomination, displayDenomination, lockInputs, onPress, compressed = false } = props
  const isoFiatCurrencyCode = useSelector(state => state.ui.settings.defaultIsoFiat)
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
        <EdgeRow
          rightButtonType={lockInputs ? 'none' : 'delete'}
          title={title}
          body={`Amount: ${cryptoAmountSyntax} (${fiatAmountSyntax})`}
          onPress={onPress}
        />
      </EdgeAnim>
    )
  } else {
    return (
      <EdgeAnim key={key} enter={{ type: 'stretchInY' }} exit={{ type: 'stretchOutY' }}>
        <EdgeRow rightButtonType={lockInputs ? 'none' : 'editable'} title={title} onPress={lockInputs ? undefined : onPress}>
          <EdgeText style={[styles.amountText, cryptoAmountStyle]} minimumFontScale={0.3}>
            {cryptoAmountSyntax}
          </EdgeText>
          {fiatAmountSyntax == null ? null : <EdgeText>{fiatAmountSyntax}</EdgeText>}
        </EdgeRow>
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
