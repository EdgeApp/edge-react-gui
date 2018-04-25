// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'

import s from '../../../../../../locales/strings.js'
import { PrimaryButton } from '../../../../components/Buttons/Buttons.ui'
import CustomFeesModal from './CustomFeesModalConnector.js'
import styles from './style'

type Props = {
  onPressed: Function,
  handlePress: Function,
  sourceWallet: EdgeCurrencyWallet
}

export default class CustomFees extends Component<Props> {
  render () {
    return (
      <View style={styles.customFeeButtonContainer}>
        <PrimaryButton text={s.strings.fragment_wallets_set_custom_fees} style={styles.customFeeButton} onPressFunction={this.props.onPressed} />
        <CustomFeesModal handlePress={this.props.handlePress} sourceWallet={this.props.sourceWallet} />
      </View>
    )
  }
}
