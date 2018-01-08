import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {
  ActivityIndicator,
  View,
  Keyboard
} from 'react-native'
import {fixFiatCurrencyCode} from '../../../utils'
import Text from '../../components/FormattedText'
import {SecondaryButton, PrimaryButton} from '../../components/Buttons'

import styles, {styles as stylesRaw} from './style.js'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'

const DONE_TEXT = s.strings.fragment_create_wallet_create_wallet
const BACK_TEXT = s.strings.title_back

export default class CreateWallet extends Component {
  constructor (props) {
    super(props)
    this.state = {
      walletName: this.props.walletName,
      selectedWalletType: this.props.selectedWalletType,
      selectedFiat: this.props.selectedFiat
    }
  }

  onSubmit = () => {
    const { walletName, selectedWalletType, selectedFiat } = this.props
    this.props.createCurrencyWallet(walletName, selectedWalletType, fixFiatCurrencyCode(selectedFiat))
  }

  onBack = () => {
    Keyboard.dismiss()
    Actions.pop()
  }

  render () {
    return (
      <View style={styles.scene}>
        <Gradient style={styles.gradient} />
        <View style={styles.view}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.create_wallet_top_instructions}</Text>
          </View>
          <View style={styles.reviewArea}>
            <Text style={styles.reviewAreaText}>{s.strings.create_wallet_name_label} {this.props.walletName}</Text>
            <Text style={styles.reviewAreaText}>{s.strings.create_wallet_crypto_type_label} {this.props.selectedWalletType}</Text>
            <Text style={styles.reviewAreaText}>{s.strings.create_wallet_fiat_type_label} {this.props.selectedFiat}</Text>
          </View>
          <View style={[styles.buttons]}>
            <SecondaryButton
              style={[styles.cancel]}
              onPressFunction={this.onBack}
              text={BACK_TEXT} />

            <PrimaryButton
              onPressFunction={this.onSubmit}
              text={DONE_TEXT}
              processingFlag={this.props.isCreatingWallet}
              processingElement={<ActivityIndicator />}
            />
          </View>
        </View>
      </View>
    )
  }
}
