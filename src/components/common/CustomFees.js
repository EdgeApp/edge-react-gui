// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'

import CustomFeesModal from '../../connectors/CustomFeesModalConnector.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import styles from '../../styles/scenes/CustomFeesStyles'

type Props = {
  onPressed: Function,
  handlePress: Function,
  sourceWallet: EdgeCurrencyWallet
}

export default class CustomFees extends Component<Props> {
  render () {
    return (
      <View style={styles.customFeeButtonContainer}>
        <PrimaryButton style={styles.customFeeButton} onPress={this.props.onPressed}>
          <PrimaryButton.Text>{s.strings.fragment_wallets_set_custom_fees}</PrimaryButton.Text>
        </PrimaryButton>
        <CustomFeesModal handlePress={this.props.handlePress} sourceWallet={this.props.sourceWallet} />
      </View>
    )
  }
}
