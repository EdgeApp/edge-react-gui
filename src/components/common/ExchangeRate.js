// @flow

import { div, log10, mul } from 'biggystring'
import { type EdgeAccount, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet } from 'react-native'

import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import type { GuiCurrencyInfo } from '../../types/types.js'
import { getTokenId } from '../../util/CurrencyInfoHelpers.js'
import { DECIMAL_PRECISION, getObjectDiff } from '../../util/utils'
import { FiatText } from '../common/text/FiatText.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type StateProps = {
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
}

type OwnProps = {
  primaryInfo: GuiCurrencyInfo,
  primaryDisplayAmount?: string, // defaults to '1'
  secondaryInfo: GuiCurrencyInfo,
  secondaryDisplayAmount: string,
  style?: StyleSheet.Styles
}

class ExchangeRateComponent extends React.Component<OwnProps & ThemeProps & StateProps> {
  shouldComponentUpdate(nextProps: OwnProps) {
    const diffElement = getObjectDiff(this.props, nextProps, {
      primaryInfo: true,
      secondaryInfo: true,
      displayDenomination: true,
      exchangeDenomination: true
    })
    return !!diffElement
  }

  render() {
    const { account, primaryInfo, primaryDisplayAmount, secondaryInfo, secondaryDisplayAmount, style, wallet } = this.props

    const primaryDisplayName: string = primaryInfo.displayDenomination.name
    const getDisplayExchangeAmount = secondaryDisplayAmount => {
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
      return <EdgeText style={style}>{s.strings.drawer_exchange_rate_loading}</EdgeText>
    }

    const primaryText = `${formattedPrimaryAmount} ${primaryDisplayName} = `
    return (
      <EdgeText style={style}>
        {primaryText}
        <FiatText
          noFiatSymbol
          nativeCryptoAmount={primaryInfo.displayDenomination.multiplier}
          tokenId={getTokenId(account, wallet.currencyInfo.pluginId, primaryInfo.exchangeCurrencyCode)}
          wallet={wallet}
        />
      </EdgeText>
    )
  }
}

export const ExchangeRate = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { primaryInfo } = ownProps
    return {
      account: state.core.account,
      wallet: state.core.account.currencyWallets[primaryInfo.walletId]
    }
  },
  dispatch => ({})
)(withTheme(ExchangeRateComponent))
