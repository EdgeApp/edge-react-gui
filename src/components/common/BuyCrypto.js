// @flow

import * as React from 'react'
import { Image, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import type { GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'

export type Props = {
  wallet: GuiWallet
}

export default class BuyCrypto extends React.Component<Props> {
  getCurrencyName = () => {
    const { wallet } = this.props
    return wallet.currencyNames[wallet.currencyCode]
  }

  render() {
    return (
      <TouchableWithoutFeedback onPress={Actions[Constants.PLUGIN_BUY]}>
        <View style={styles.buyCryptoContainer}>
          <View style={styles.buyCryptoBox}>
            <Image style={styles.buyCryptoBoxImage} source={{ uri: this.props.wallet.symbolImage }} resizeMode="cover" />
            <T style={styles.buyCryptoBoxText}>{sprintf(s.strings.transaction_list_buy_crypto_message, this.getCurrencyName)}</T>
          </View>
          <View style={styles.buyCryptoNoTransactionBox}>
            <T style={styles.buyCryptoNoTransactionText}>{s.strings.transaction_list_no_tx_yet}</T>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

const rawStyles = {
  buyCryptoContainer: {
    backgroundColor: THEME.COLORS.GRAY_4,
    width: PLATFORM.deviceWidth,
    height: scale(220),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(15)
  },
  buyCryptoBox: {
    flex: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  buyCryptoBoxImage: {
    width: scale(40),
    height: scale(40)
  },
  buyCryptoBoxText: {
    marginTop: scale(10),
    fontSize: scale(17),
    color: THEME.COLORS.GRAY_1
  },
  buyCryptoNoTransactionBox: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buyCryptoNoTransactionText: {
    fontSize: scale(17),
    color: THEME.COLORS.ACCENT_BLUE
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
