// @flow
import React, { Component } from 'react'
import { Image, Text, TouchableHighlight, View } from 'react-native'

import s from '../../locales/strings'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletListRowStyle as styles } from '../../styles/components/CryptoExchangeWalletListRowStyle.js'
import { type GuiWalletType } from '../../types/types.js'

type Props = {
  supportedWallet: GuiWalletType,
  onPress(GuiWalletType): void
}

export class WalletListModalCreateRow extends Component<Props> {
  onPress = () => this.props.onPress(this.props.supportedWallet)
  render() {
    const { supportedWallet } = this.props
    return (
      <View style={styles.container}>
        <TouchableHighlight style={styles.touchable} underlayColor={styles.underlayColor} onPress={this.onPress}>
          <View style={styles.rowContainerTop}>
            <View style={styles.containerLeft}>
              <Image style={styles.imageContainer} source={{ uri: supportedWallet.symbolImage }} resizeMode="contain" />
            </View>
            <View style={[styles.containerCenter, styles.containerCreateCenter]}>
              <FormattedText style={styles.containerCenterCurrency}>{supportedWallet.currencyCode}</FormattedText>
              <FormattedText style={styles.containerCenterName}>{supportedWallet.label}</FormattedText>
            </View>
            <View style={styles.containerRight}>
              <Text style={styles.createText}>{s.strings.fragment_create_wallet_create_wallet}</Text>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
