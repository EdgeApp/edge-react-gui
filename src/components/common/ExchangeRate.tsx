import { div, log10, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { TextStyle } from 'react-native'

import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { GuiCurrencyInfo } from '../../types/types'
import { DECIMAL_PRECISION } from '../../util/utils'
import { ThemeProps, withTheme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'

interface StateProps {
  wallet: EdgeCurrencyWallet
}

interface OwnProps {
  primaryInfo: GuiCurrencyInfo
  primaryDisplayAmount?: string // defaults to '1'
  secondaryInfo: GuiCurrencyInfo
  secondaryDisplayAmount: string
  style?: TextStyle
}

class ExchangeRateComponent extends React.Component<OwnProps & ThemeProps & StateProps> {
  render() {
    const { primaryInfo, primaryDisplayAmount, secondaryInfo, secondaryDisplayAmount, style, wallet } = this.props

    const primaryDisplayName: string = primaryInfo.displayDenomination.name
    const getDisplayExchangeAmount = (secondaryDisplayAmount: string) => {
      const primaryRatio = div(primaryInfo.displayDenomination.multiplier, primaryInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
      const secondaryRatio = div(secondaryInfo.displayDenomination.multiplier, secondaryInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
      return mul(div(primaryRatio, secondaryRatio, 4), secondaryDisplayAmount)
    }
    let precision = secondaryInfo.displayDenomination.multiplier ? log10(secondaryInfo.displayDenomination.multiplier) : 0
    let formattedSecondaryDisplayAmount: string = parseFloat(getDisplayExchangeAmount(secondaryDisplayAmount)).toFixed(precision)
    // if exchange rate is too low, then add decimal places
    if (parseFloat(formattedSecondaryDisplayAmount) <= 0.1) {
      precision += 3
      formattedSecondaryDisplayAmount = parseFloat(getDisplayExchangeAmount(secondaryDisplayAmount)).toFixed(precision)
    }
    const secondaryCurrencyCode: string = secondaryInfo.displayDenomination.name

    const exchangeData = {
      primaryDisplayAmount: primaryDisplayAmount || '1',
      primaryDisplayName,
      secondaryDisplayAmount: formattedSecondaryDisplayAmount,
      secondaryCurrencyCode
    }
    const formattedPrimaryAmount = formatNumber(primaryDisplayAmount || '1')

    const { primaryDisplayAmount: primaryAmount, secondaryDisplayAmount: secondaryAmount } = exchangeData
    if (primaryAmount == null || primaryDisplayName == null || secondaryAmount == null || secondaryCurrencyCode == null) {
      return <EdgeText style={style}>{lstrings.drawer_exchange_rate_loading}</EdgeText>
    }

    const primaryText = `${formattedPrimaryAmount} ${primaryDisplayName} = `
    return (
      <EdgeText style={style}>
        {primaryText}
        <FiatText nativeCryptoAmount={primaryInfo.displayDenomination.multiplier} tokenId={primaryInfo.tokenId} wallet={wallet} />
      </EdgeText>
    )
  }
}

export const ExchangeRate = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { primaryInfo } = ownProps
    return {
      wallet: state.core.account.currencyWallets[primaryInfo.walletId]
    }
  },
  dispatch => ({})
)(withTheme(ExchangeRateComponent))
