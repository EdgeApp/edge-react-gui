// @flow

import { type EdgeAccount } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { CREATE_WALLET_SELECT_FIAT, CURRENCY_PLUGIN_NAMES, getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { errorModal } from '../../modules/UI/components/Modals/ErrorModal.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type CreateWalletType } from '../../types/types.js'
import { FormField } from '../common/FormField.js'
import { launchModal } from '../common/ModalProvider.js'

type OwnProps = {
  selectedWalletType: CreateWalletType
}
type StateProps = {
  account: EdgeAccount
}
type DispatchProps = {}
type Props = OwnProps & StateProps & DispatchProps

type State = {
  input: string,
  error: string,
  isProcessing: boolean,
  cleanedPrivateKey: string
}

class CreateWalletImportComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      input: '',
      error: '',
      isProcessing: false,
      cleanedPrivateKey: ''
    }
  }

  onNext = async () => {
    const { account, selectedWalletType } = this.props
    const { input } = this.state

    this.setState({
      isProcessing: true
    })
    try {
      const { currencyCode } = selectedWalletType
      const currencyPluginName = CURRENCY_PLUGIN_NAMES[currencyCode]
      const currencyPlugin = account.currencyConfig[currencyPluginName]
      await currencyPlugin.importKey(input)
      Actions[CREATE_WALLET_SELECT_FIAT]({ selectedWalletType, cleanedPrivateKey: input })
      this.setState({
        isProcessing: false
      })
    } catch (error) {
      await launchModal(errorModal(s.strings.create_wallet_failed_import_header, error))
      this.setState({
        isProcessing: false
      })
    }
  }

  onChangeText = (input: string) => {
    this.setState({ input })
  }

  render() {
    const { error, isProcessing, input } = this.state
    const { selectedWalletType } = this.props
    const { currencyCode } = selectedWalletType
    const specialCurrencyInfo = getSpecialCurrencyInfo(currencyCode)
    if (!specialCurrencyInfo.isImportKeySupported) throw new Error()
    const instructionSyntax = specialCurrencyInfo.isImportKeySupported.privateKeyInstructions
    const labelKeySyntax = specialCurrencyInfo.isImportKeySupported.privateKeyLabel
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.view}>
            <View style={styles.createWalletPromptArea}>
              <Text style={styles.instructionalText}>{instructionSyntax}</Text>
            </View>
            <FormField
              style={{ flex: 1, height: 150 }}
              autoFocus
              clearButtonMode="while-editing"
              autoCorrect={false}
              onChangeText={this.onChangeText}
              label={labelKeySyntax}
              value={input}
              returnKeyType="next"
              onSubmitEditing={this.onNext}
              numberOfLines={5}
              multiline
              error={error}
            />
            <View style={styles.buttons}>
              <PrimaryButton style={styles.next} onPress={this.onNext} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
              </PrimaryButton>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}

export const CreateWalletImportScene = connect(
  (state: ReduxState): StateProps => ({
    account: state.core.account
  }),
  (dispatch: Dispatch): DispatchProps => ({})
)(CreateWalletImportComponent)
