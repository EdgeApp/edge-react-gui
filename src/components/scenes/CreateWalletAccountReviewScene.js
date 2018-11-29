// @flow

import React, { Component } from 'react'
import { Image, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import eosLogo from '../../assets/images/currencies/fa_logo_eos.png'
import steemLogo from '../../assets/images/currencies/fa_logo_steem.png'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import Text from '../../modules/UI/components/FormattedText'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import WalletListModal from '../../modules/UI/components/WalletListModal/WalletListModalConnector.js'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import type { GuiFiatType, GuiWalletType } from '../../types.js'

const logos = {
  eos: eosLogo,
  steem: steemLogo
}

export type CreateWalletAccountReviewOwnProps = {
  selectedFiat: GuiFiatType,
  selectedWalletType: GuiWalletType
}
type Props = CreateWalletAccountReviewOwnProps
type State = {
  walletName: string
}

export class CreateWalletAccountReview extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {}
  }

  onBack = () => {
    Actions.pop()
  }

  handleChangeHandle = (accountHandle: string) => {
    this.setState({ accountHandle })
  }

  handleChangePassword = (password: string) => {
    this.setState({ password })
  }

  onPressSelect = () => {
    this.setState({})
  }

  render () {
    const amountString = '20 EOS'
    const instructionSyntax = sprintf(s.strings.create_wallet_account_make_payment, amountString)
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <KeyboardAwareScrollView>
            <View style={styles.view}>
              <Image source={logos['eos']} style={styles.currencyLogo} resizeMode={'cover'} />
              <View style={styles.createWalletPromptArea}>
                <Text style={styles.instructionalText}>{instructionSyntax}</Text>
              </View>
            </View>
            <View style={styles.selectPaymentLower}>
              <View style={styles.buttons}>
                <PrimaryButton style={[styles.next]} onPress={this.onPressSelect}>
                  <PrimaryButton.Text>{s.strings.create_wallet_account_select_wallet}</PrimaryButton.Text>
                </PrimaryButton>
              </View>
              <View style={styles.paymentArea}>
                <Text style={styles.paymentLeft}>Amount due:</Text>
                <Text style={styles.paymentRight}>5.00 EOS</Text>
              </View>
            </View>
          </KeyboardAwareScrollView>
          {this.state.isModalVisible && (
            <WalletListModal topDisplacement={Constants.TRANSACTIONLIST_WALLET_DIALOG_TOP} type={Constants.FROM} onSelectWallet={this.onSelectWallet} />
          )}
        </View>
      </SafeAreaView>
    )
  }
}
