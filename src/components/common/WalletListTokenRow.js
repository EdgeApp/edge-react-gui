// @flow

import type { EdgeDenomination } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import styles, { styles as styleRaw } from '../../styles/scenes/WalletListStyle'
import { type GuiWallet } from '../../types/types.js'
import * as UTILS from '../../util/utils'
import { ProgressPie } from './ProgressPie.js'

type OwnProps = {
  parentId: string,
  sortHandlers: any,
  currencyCode: string,
  balance: string,
  walletFiatSymbol: string,
  showBalance: boolean,
  progress: number
}

export type StateProps = {
  displayDenomination: EdgeDenomination,
  settings: Object,
  exchangeRates: Object,
  currencyCode: string,
  wallet: GuiWallet
}

export type DispatchProps = {
  selectWallet: (id: string, currencyCode: string) => any
}

type Props = OwnProps & StateProps & DispatchProps

export class WalletListTokenRow extends PureComponent<Props> {
  selectWallet = () => {
    const { parentId: walletId, currencyCode } = this.props
    this.props.selectWallet(walletId, currencyCode)
    Actions.transactionList({ params: 'walletList' })
  }

  render () {
    const { wallet, currencyCode, settings, exchangeRates, walletFiatSymbol, showBalance, progress } = this.props
    const { name } = wallet
    const meta = wallet.metaTokens.find(token => token.currencyCode === currencyCode)
    const symbolImage = meta ? meta.symbolImage : null
    const cryptoAmount = intl.formatNumber(UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(this.props.balance) || '0') // check if infinitesimal (would display as zero), cut off trailing zeroes
    const cryptoAmountString = showBalance ? cryptoAmount : ''
    const rateKey = `${currencyCode}_${wallet.isoFiatCurrencyCode}`
    const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : null
    // Fiat Balance Formatting
    const fiatBalance = UTILS.getCurrencyAccountFiatBalanceFromWalletWithoutState(wallet, currencyCode, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
    const fiatBalanceString = showBalance && exchangeRate ? `${walletFiatSymbol} ${fiatBalanceFormat}` : ''
    // Exhange Rate Formatting
    const exchangeRateFormat = exchangeRate ? intl.formatNumber(exchangeRate, { toFixed: 2 }) : null
    const exchangeRateString = exchangeRateFormat ? `${walletFiatSymbol} ${exchangeRateFormat}/${currencyCode}` : s.strings.no_exchange_rate
    // Yesterdays Percentage Difference Formatting
    const yesterdayUsdExchangeRate = exchangeRates[`${currencyCode}_iso:USD_${UTILS.getYesterdayDateRoundDownHour()}`]
    const fiatExchangeRate = wallet.isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${wallet.isoFiatCurrencyCode}`] : 1
    const yesterdayExchangeRate = yesterdayUsdExchangeRate * fiatExchangeRate
    const differenceYesterday = exchangeRate ? exchangeRate - yesterdayExchangeRate : null
    let differencePercentage = differenceYesterday ? (differenceYesterday / yesterdayExchangeRate) * 100 : null
    if (!yesterdayExchangeRate) {
      differencePercentage = ''
    }
    let differencePercentageString, differencePercentageStringStyle
    if (!exchangeRate || !differencePercentage || isNaN(differencePercentage)) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferenceNeutral
      differencePercentageString = ''
    } else if (exchangeRate && differencePercentage && differencePercentage === 0) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferenceNeutral
      differencePercentageString = `0.00%`
    } else if (exchangeRate && differencePercentage && differencePercentage < 0) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferenceNegative
      differencePercentageString = `- ${Math.abs(differencePercentage).toFixed(2)}%`
    } else if (exchangeRate && differencePercentage && differencePercentage > 0) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferencePositive
      differencePercentageString = `+ ${Math.abs(differencePercentage).toFixed(2)}%`
    }

    return (
      <TouchableHighlight
        style={styles.tokenRowContainer}
        underlayColor={styleRaw.tokenRowUnderlay.color}
        delayLongPress={500}
        onPress={this.selectWallet}
        {...this.props.sortHandlers}
      >
        <View style={[styles.rowContent]}>
          <View style={styles.rowIconWrap}>
            {symbolImage && <Image style={[styles.rowCurrencyLogoAndroid]} source={{ uri: symbolImage }} resizeMode="cover" />}
            <View style={styles.rowCurrencyLogoAndroid}>
              <ProgressPie size={styles.rowCurrencyOverlaySize} color={'rgba(255, 255, 255, 0.75)'} progress={progress} />
            </View>
          </View>
          <View style={styles.walletDetailsContainer}>
            <View style={styles.walletDetailsRow}>
              <T style={[styles.walletDetailsRowCurrency]}>{currencyCode}</T>
              <T style={[styles.walletDetailsRowValue]}>{cryptoAmountString}</T>
            </View>
            <View style={styles.walletDetailsRow}>
              <T style={[styles.walletDetailsRowName]}>{name}</T>
              <T style={[styles.walletDetailsRowFiat]}>{fiatBalanceString}</T>
            </View>
            <View style={styles.walletDetailsRowLine} />
            <View style={styles.walletDetailsRow}>
              <T style={[styles.walletDetailsRowExchangeRate]}>{exchangeRateString}</T>
              <T style={[differencePercentageStringStyle]}>{differencePercentageString}</T>
            </View>
          </View>
          <View style={styles.rowOptionsWrap} />
        </View>
      </TouchableHighlight>
    )
  }
}
