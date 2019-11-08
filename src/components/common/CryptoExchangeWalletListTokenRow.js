// @flow
import React, { Component } from 'react'
import { Text, TouchableHighlight, View } from 'react-native'

import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletListRowStyle as styles } from '../../styles/indexStyles'

type Props = {
  currencyCode: string,
  parentId: string,
  fiatSymbol: string,
  fiatBalance: string,
  cryptoBalance: string,
  parentCryptoBalance: string,
  disabled: boolean,
  onPress({ id: string, currencyCode: string }): void
}
type LocalState = {}

class CryptoExchangeWalletListTokenRow extends Component<Props, LocalState> {
  onPress = () => {
    const isDisabled = this.props.disabled && this.props.parentCryptoBalance === '0'
    if (isDisabled) return
    this.props.onPress({
      id: this.props.parentId,
      currencyCode: this.props.currencyCode
    })
  }
  render () {
    const isDisabled =
      this.props.disabled &&
      ((this.props.cryptoBalance === '0' && (this.props.fiatBalance === '0' || this.props.fiatBalance === '0.00')) || this.props.parentCryptoBalance === '0')
    return (
      <TouchableHighlight style={styles.touchable} underlayColor={styles.underlayColor} onPress={this.onPress}>
        <View style={styles.containerToken}>
          <View style={styles.containerLeft} />
          <View style={styles.containerCenter}>
            <FormattedText style={[styles.enabled, isDisabled && styles.zeroBalance]}>{this.props.currencyCode}</FormattedText>
          </View>
          <View style={styles.containerRight}>
            <View style={styles.holderView}>
              <Text style={[styles.balanceTextStyle, isDisabled && styles.zeroBalance]}>{this.props.cryptoBalance}</Text>
              <Text style={[styles.balanceTextStyle, isDisabled && styles.zeroBalance]}>
                {this.props.fiatSymbol} {this.props.fiatBalance}
              </Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

export { CryptoExchangeWalletListTokenRow }
