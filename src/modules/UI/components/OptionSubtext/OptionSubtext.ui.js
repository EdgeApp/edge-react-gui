// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import s from '../../../../locales/strings.js'
import T from '../FormattedText/FormattedText.ui'
import styles from './style.js'

type Props = {
  confirmationText: string,
  label: string,
  walletName?: string
}

export default class OptionSubtext extends Component<Props> {
  render () {
    const nameOrThisWallet = this.props.walletName || s.strings.fragment_wallets_this_wallet

    return (
      <View style={{ alignItems: 'center' }}>
        <T style={styles.subHeaderSyntax}>{this.props.confirmationText}</T>
        <T style={styles.subHeaderWalletName}>{nameOrThisWallet}</T>
      </View>
    )
  }
}
