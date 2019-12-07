// @flow
import React, { Component } from 'react'
import { Image, Text, TouchableHighlight, View } from 'react-native'

import localize from '../../locales/strings'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletListRowStyle as styles } from '../../styles/indexStyles'

type Props = {
  supportedWallet: Object,
  onPress(Object): void
}
type State = {}

class CryptoExchangeCreateWalletRow extends Component<Props, State> {
  onPress = () => {
    this.props.onPress(this.props.supportedWallet)
  }
  render () {
    const { supportedWallet } = this.props
    console.log(supportedWallet)
    return (
      <View style={styles.container}>
        <TouchableHighlight style={styles.touchable} underlayColor={styles.underlayColor} onPress={this.onPress}>
          <View style={styles.rowContainerTop}>
            <View style={styles.containerLeft}>
              <Image style={styles.imageContainer} source={{ uri: supportedWallet.symbolImage }} resizeMode={'contain'} />
            </View>
            <View style={[styles.containerCenter, styles.containerCreateCenter]}>
              <FormattedText style={styles.containerCenterCurrency}>{supportedWallet.currencyCode}</FormattedText>
              <FormattedText style={styles.containerCenterName}>{supportedWallet.label}</FormattedText>
            </View>
            <View style={styles.containerRight}>
              <Text style={styles.createText}>{localize.strings.fragment_create_wallet_create_wallet}</Text>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}

export { CryptoExchangeCreateWalletRow }
