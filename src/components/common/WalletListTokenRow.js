// @flow

import type { EdgeDenomination } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { intl } from '../../locales/intl'
import T from '../../modules/UI/components/FormattedText/index'
import styles, { styles as styleRaw } from '../../styles/scenes/WalletListStyle'
import { type GuiWallet } from '../../types/types.js'
import * as UTILS from '../../util/utils'

type OwnProps = {
  parentId: string,
  sortHandlers: any,
  currencyCode: string,
  balance: string,
  fiatSymbol: string,
  showBalance: boolean
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
    const { wallet, currencyCode, settings, exchangeRates, fiatSymbol, showBalance } = this.props
    const { name } = wallet
    const meta = wallet.metaTokens.find(token => token.currencyCode === currencyCode)
    const symbolImage = meta ? meta.symbolImage : null
    const cryptoAmount = intl.formatNumber(UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(this.props.balance) || '0') // check if infinitesimal (would display as zero), cut off trailing zeroes
    const cryptoAmountString = showBalance ? cryptoAmount : ''
    const fiatBalance = UTILS.getCurrencyAccountFiatBalanceFromWalletWithoutState(wallet, currencyCode, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
    const fiatBalanceString = showBalance ? `${fiatSymbol} ${fiatBalanceFormat}` : ''
    const rateKey = `${currencyCode}_${settings.defaultIsoFiat}`
    const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
    const exchangeRateFormat = intl.formatNumber(exchangeRate, { toFixed: 2 }) || '0'
    const exchangeRateString = `${fiatSymbol} ${exchangeRateFormat}/${currencyCode}`
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
            </View>
          </View>
          <View style={styles.rowOptionsWrap} />
        </View>
      </TouchableHighlight>
    )
  }
}
