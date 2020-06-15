// @flow
import React, { Component } from 'react'
import { Image, Text, TouchableHighlight, View } from 'react-native'

import s from '../../locales/strings'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { CryptoExchangeWalletListRowStyle as styles } from '../../styles/components/CryptoExchangeWalletListRowStyle.js'

type Props = {
  currencyCode: string,
  image?: string,
  name: string,
  type: 'wallet' | 'token',
  onPress(): void
}

export class WalletListModalCreateRow extends Component<Props> {
  render() {
    const { image, currencyCode, name, type, onPress } = this.props
    return (
      <View style={styles.container}>
        <TouchableHighlight style={styles.touchable} underlayColor={styles.underlayColor} onPress={onPress}>
          <View style={[type === 'token' ? styles.containerToken : null, styles.rowContainerTop]}>
            <View style={styles.containerLeft}>
              <Image style={styles.imageContainer} source={{ uri: image }} resizeMode="contain" />
            </View>
            <View style={[styles.containerCenter, styles.containerCreateCenter]}>
              <FormattedText style={styles.containerCenterCurrency}>{currencyCode}</FormattedText>
              <FormattedText style={styles.containerCenterName}>{name}</FormattedText>
            </View>
            <View style={styles.containerRight}>
              <Text style={styles.createText}>
                {type === 'wallet' ? s.strings.fragment_create_wallet_create_wallet : s.strings.fragment_create_wallet_create_token}
              </Text>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
