// @flow

import React, { Component } from 'react'
import { Text, View } from 'react-native'
import type { GuiWallet } from '../../../../types.js'

import { AlertBody, AlertContainer, AlertHeader } from '../DropdownAlert/components'
import DropdownAlert from '../DropdownAlert/DropdownAlert.ui'
import styles from './style.js'
export type Props = {
  message: string,
  displayDropdown: boolean,
  progressPercentage: string,
  dismissAlert: Function,
  wallets: Array<GuiWallet>,
  dismissAlert: Function
}

export default class WalletListProgressDropdown extends Component<Props> {
  render () {
    /* const wallets = this.props.wallets
    const numberOfWallets = this.props.numberOfWallets

    let progress = 0
    for (const walletId of this.props.ethWalletKeys) {
      progress += (wallets[walletId].addressLoadingProgress / numberOfWallets)
    } */
    return (
      <DropdownAlert visible={this.props.displayDropdown} onClose={this.props.dismissAlert} >
        <View>
          <AlertContainer style={styles.dropdownContainer}>
            <AlertHeader style={styles.dropdownHeader}><Text style={styles.dropdownHeaderText}>Wallet Loading Progress...</Text></AlertHeader>
            <AlertBody>
              <Text>Hello, progress is: </Text>
            </AlertBody>
          </AlertContainer>
        </View>
      </DropdownAlert>
    )
  }
}
