// @flow
import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'

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
  image: any,
  name: string,
  onPress({ id: string, currencyCode: string }): void
}
type LocalState = {}

class CryptoExchangeWalletListTokenRow extends Component<Props, LocalState> {
  onPress = () => {
    if (this.props.disabled || this.props.parentCryptoBalance === '0') return
    this.props.onPress({
      id: this.props.parentId,
      currencyCode: this.props.currencyCode
    })
  }
  render () {
    return (
      <TouchableHighlight style={styles.touchable} underlayColor={styles.underlayColor} onPress={this.onPress}>
        <View style={[styles.containerToken, styles.rowContainerTop]}>
          <View style={styles.containerLeft}>
            <Image style={styles.imageContainer} source={{ uri: this.props.image }} resizeMode={'contain'} />
          </View>
          <View style={styles.walletDetailsContainer}>
            <View style={styles.walletDetailsRow}>
              <FormattedText style={[styles.walletDetailsRowCurrency]}>{this.props.currencyCode}</FormattedText>
              <FormattedText style={[styles.walletDetailsRowValue]}>{this.props.cryptoBalance}</FormattedText>
            </View>
            <View style={styles.walletDetailsRow}>
              <FormattedText style={[styles.walletDetailsRowName]}>{this.props.name}</FormattedText>
              <FormattedText style={[styles.walletDetailsRowFiat]}>
                {this.props.fiatSymbol} {this.props.fiatBalance}
              </FormattedText>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

export { CryptoExchangeWalletListTokenRow }
