// @flow

import React, { Component } from 'react'
import { View, Image } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'
import Text from '../../modules/UI/components/FormattedText'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from 'edge-components'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { MaterialInputOnWhite } from '../../styles/components/FormFieldStyles.js'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import type { GuiFiatType, GuiWalletType } from '../../types.js'
import eosLogo from '../../assets/images/currencies/fa_logo_eos.png'
import steemLogo from '../../assets/images/currencies/fa_logo_steem.png'

export type CreateWalletAccountOwnProps = {
  selectedWalletType: string,
  selectedFiat: string
}
type Props = CreateWalletAccountOwnProps

type State = {

}

const logos = {
  eos: eosLogo,
  steem: steemLogo
}

export class CreateWalletAccount extends Component<Props> {
  constructor (props: Props) {
    super(props)

  }

  onCreateAccount = () => {
    Actions[Constants.CREATE_WALLET_ACCOUNT_SETUP]({
      ...this.props
    })
  }

  onLoginAccount = () => {
    Actions[Constants.CREATE_WALLET_ACCOUNT_LOGIN]({
      ...this.props
    })
  }

  onBack = () => {
    Actions.pop()
  }

  render () {
    const instructionSyntaxTop = sprintf(s.strings.create_wallet_account_instructions, 'EOS')
    const instructionSyntaxBottom = sprintf(s.strings.create_wallet_new_account, 'EOS')
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.view}>
            <Image source={logos['eos']} style={styles.currencyLogo} resizeMode={'cover'} />
            <View style={styles.createWalletPromptArea}>
              <Text style={styles.instructionalText}>{instructionSyntaxTop}</Text>
            </View>
            <View>
              <SecondaryButton onPress={this.onCreateAccount}>
                <SecondaryButton.Text>{s.strings.create_wallet_create_account}</SecondaryButton.Text>
              </SecondaryButton>
            </View>
            <View style={styles.createWalletPromptArea}>
              <Text style={styles.instructionalText}>{instructionSyntaxBottom}</Text>
            </View>
            <View>
              <PrimaryButton onPress={this.onLoginAccount}>
                <PrimaryButton.Text>{s.strings.create_wallet_account_login}</PrimaryButton.Text>
              </PrimaryButton>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
