// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'

import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CustomWalletListRowStyles as styles } from '../../styles/indexStyles'

type Props = {
  wallet: EdgeCurrencyWallet,
  onPress(EdgeCurrencyWallet): void
}
type State = {}

class CustomWalletListRow extends Component<Props, State> {
  onPress = () => {
    this.props.onPress(this.props.wallet)
  }
  render () {
    const { wallet } = this.props
    return (
      <TouchableHighlight style={styles.touchable} underlayColor={styles.underlayColor} onPress={this.onPress}>
        <View style={styles.container}>
          <View style={styles.containerLeft}>
            <Image style={styles.imageContainer} source={{ uri: wallet.currencyInfo.symbolImage }} resizeMode={'contain'} />
          </View>
          <View style={styles.containerRight}>
            <FormattedText>
              {wallet.name} ({wallet.currencyInfo.currencyCode})
            </FormattedText>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

export { CustomWalletListRow }
