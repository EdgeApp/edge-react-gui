// @flow

import React, { Component } from 'react'
import { Image, View } from 'react-native'

import s from '../../../../locales/strings.js'
import { CryptoExchangeQuoteSceneStyles } from '../../../../styles/indexStyles.js'
import FormattedText from '../../components/FormattedText'

type Props = {
  isTop?: boolean | null,
  headline: string,
  walletIcon: string,
  cryptoAmount: string,
  currency: string,
  currencyCode: string,
  fiatCurrencyCode: string,
  fiatCurrencyAmount: string,
  walletName: string,
  miningFee?: string | null
}
type State = {}

class ExchangeQuoteComponent extends Component<Props, State> {
  renderBottom = () => {
    const styles = CryptoExchangeQuoteSceneStyles.quoteDetailContainer
    if (this.props.isTop) {
      return (
        <View style={styles.bottomRow}>
          <View style={styles.bottomContentBox}>
            <View style={styles.bottomContentBoxLeft}>
              <FormattedText style={styles.minerFeeText}>{s.strings.mining_fee}</FormattedText>
            </View>
            <View style={styles.bottomContentBoxRight}>
              <FormattedText style={styles.minerFeeRightText}>{this.props.miningFee}</FormattedText>
            </View>
          </View>
        </View>
      )
    }
    return null
  }
  render () {
    const styles = CryptoExchangeQuoteSceneStyles.quoteDetailContainer
    const container = this.props.isTop ? styles.containerExpanded : styles.containerCollapsed
    return (
      <View style={styles.container}>
        <FormattedText style={styles.headlineText}>{this.props.headline}</FormattedText>
        <View style={container}>
          <View style={styles.topRow}>
            <View style={styles.logoContainer}>
              <View style={styles.iconContainer}>
                <Image style={styles.currencyIcon} source={{ uri: this.props.walletIcon }} />
              </View>
            </View>
            <View style={styles.walletInfoContainer}>
              <FormattedText style={styles.currencyNameText} isBold>
                {this.props.currency}
              </FormattedText>
              <FormattedText style={styles.walletNameText} numberOfLines={1}>
                {this.props.walletName}
              </FormattedText>
            </View>
            <View style={styles.amountInfoContainer}>
              <FormattedText style={styles.cryptoAmountText} isBold>
                {this.props.cryptoAmount} {this.props.currencyCode}
              </FormattedText>
              <FormattedText style={styles.fiatAmountText}>
                {this.props.fiatCurrencyAmount} {this.props.fiatCurrencyCode}
              </FormattedText>
            </View>
          </View>
          {this.renderBottom()}
        </View>
      </View>
    )
  }
}

export { ExchangeQuoteComponent }
