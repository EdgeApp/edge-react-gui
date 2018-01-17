// @flow

import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  ActivityIndicator,
  View,
  Keyboard
} from 'react-native'
import SafeAreaView from '../../components/SafeAreaView'
import {fixFiatCurrencyCode} from '../../../utils'
import Text from '../../components/FormattedText'
import {SecondaryButton, PrimaryButton} from '../../components/Buttons'

import styles, {styles as stylesRaw} from './style.js'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import { createCurrencyWallet } from '../../../../actions/indexActions'
import type { GuiWalletType, GuiFiatType } from '../../../../types'

export type CreateWalletReviewOwnProps = {
  walletName: string,
  selectedFiat: GuiFiatType,
  selectedWalletType: GuiWalletType,
  createCurrencyWallet: Function,
  isCreatingWallet: boolean,
  supportedWalletTypes: Array<GuiWalletType>,
  supportedFiats: Array<GuiFiatType>
}

export type CreateWalletReviewDispatchProps = {
  createCurrencyWallet: (string, string, string) => void
}

export type CreateWalletReviewComponentProps = CreateWalletReviewOwnProps & CreateWalletReviewDispatchProps

export class CreateWalletReviewComponent extends Component<CreateWalletReviewComponentProps> {
  onSubmit = (): void => {
    const { walletName, selectedWalletType, selectedFiat } = this.props
    this.props.createCurrencyWallet(walletName, selectedWalletType.value, fixFiatCurrencyCode(selectedFiat.value))
  }

  onBack = (): void => {
    Keyboard.dismiss()
    Actions.pop()
  }

  render () {
    const {walletName, selectedWalletType, selectedFiat, isCreatingWallet} = this.props
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.view}>
            <View style={styles.instructionalArea}>
              <Text style={styles.instructionalText}>{s.strings.create_wallet_top_instructions}</Text>
            </View>
            <View style={styles.reviewArea}>
              <Text style={styles.reviewAreaText}>{s.strings.create_wallet_name_label} {this.props.walletName}</Text>
              <Text style={styles.reviewAreaText}>{s.strings.create_wallet_crypto_type_label} {this.props.selectedWalletType.label} - {this.props.selectedWalletType.currencyCode}</Text>
              <Text style={styles.reviewAreaText}>{s.strings.create_wallet_fiat_type_label} {this.props.selectedFiat.label}</Text>
            </View>
            <View style={[styles.buttons]}>
              <SecondaryButton
                style={[styles.cancel]}
                onPressFunction={this.onBack}
                text={s.strings.title_back} />

              <PrimaryButton
                onPressFunction={this.onSubmit}
                text={s.strings.fragment_create_wallet_create_wallet}
                processingFlag={isCreatingWallet}
                processingElement={<ActivityIndicator />}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
