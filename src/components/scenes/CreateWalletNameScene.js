// @flow

import * as React from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import type { CreateWalletType, GuiFiatType } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { FormField, MaterialInputOnWhite } from '../common/FormField.js'

export type CreateWalletNameOwnProps = {
  selectedFiat: GuiFiatType,
  selectedWalletType: CreateWalletType,
  cleanedPrivateKey?: string
}
type Props = CreateWalletNameOwnProps
type State = {
  walletName: string
}

export class CreateWalletName extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    let walletName = ''
    // XXX Hack for Ripple
    if (this.props.selectedWalletType.currencyCode.toLowerCase() === 'xrp') {
      walletName = sprintf(s.strings.my_crypto_wallet_name, 'XRP')
    } else {
      walletName = sprintf(s.strings.my_crypto_wallet_name, this.props.selectedWalletType.currencyName)
    }
    this.state = { walletName }
  }

  isValidWalletName = () => {
    const { walletName } = this.state
    const isValid = walletName.length > 0

    return isValid
  }

  onNext = () => {
    const { cleanedPrivateKey, selectedFiat, selectedWalletType } = this.props
    if (this.isValidWalletName()) {
      Actions[Constants.CREATE_WALLET_REVIEW]({
        walletName: this.state.walletName,
        selectedFiat: selectedFiat,
        selectedWalletType: selectedWalletType,
        cleanedPrivateKey
      })
    } else {
      Alert.alert(s.strings.create_wallet_invalid_name, s.strings.create_wallet_enter_valid_name)
    }
  }

  onBack = () => {
    Actions.pop()
  }

  handleChangeWalletName = (walletName: string) => {
    this.setState({ walletName })
  }

  render() {
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.view}>
            <WalletNameInput onChangeText={this.handleChangeWalletName} value={this.state.walletName} onNext={this.onNext} />
            <View style={styles.buttons}>
              <SecondaryButton style={styles.back} onPress={this.onBack}>
                <SecondaryButton.Text>{s.strings.title_back}</SecondaryButton.Text>
              </SecondaryButton>

              <PrimaryButton style={styles.next} onPress={this.onNext}>
                <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
              </PrimaryButton>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}

// //////////////////////////// WalletNameInput /////////////////////////////////

export type WalletNameInputProps = {
  value: string,
  onChangeText: (walletName: string) => void,
  onNext: () => void
}

class WalletNameInput extends React.Component<WalletNameInputProps> {
  render() {
    return (
      <View style={styles.pickerView}>
        <FormField
          {...MaterialInputOnWhite}
          containerStyle={{
            ...MaterialInputOnWhite.containerStyle,
            width: '100%'
          }}
          autoFocus
          autoCorrect={false}
          onChangeText={this.props.onChangeText}
          label={s.strings.fragment_wallets_addwallet_name_hint}
          value={this.props.value}
          returnKeyType="next"
          onSubmitEditing={this.props.onNext}
        />
      </View>
    )
  }
}

const rawStyles = {
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  gradient: {
    height: THEME.HEADER,
    width: '100%',
    position: 'absolute'
  },
  view: {
    position: 'relative',
    top: THEME.HEADER,
    paddingHorizontal: 20,
    height: PLATFORM.usableHeight
  },
  pickerView: {
    marginBottom: scale(15)
  },
  buttons: {
    marginTop: scale(24),
    flexDirection: 'row'
  },
  next: {
    marginLeft: scale(1),
    flex: 1
  },
  back: {
    marginRight: scale(1),
    flex: 1
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
