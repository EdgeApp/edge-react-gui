// @flow

import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { CREATE_WALLET_SELECT_FIAT } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import Text from '../../modules/UI/components/FormattedText'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { errorModal } from '../../modules/UI/components/Modals/ErrorModal.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { type GuiWalletType } from '../../types/types.js'
import { FormField } from '../common/FormField.js'
import { launchModal } from '../common/ModalProvider.js'

type CreateWalletImportState = {
  input: string,
  error: string,
  isProcessing: boolean,
  cleanedPrivateKey: string
}

type CreateWalletImportOwnProps = {
  selectedWalletType: GuiWalletType
}

type CreateWalletImportStateProps = {
  currencyPlugin: Object
}

type CreateWalletImportDispatchProps = {}

type CreateWalletImportProps = CreateWalletImportOwnProps & CreateWalletImportStateProps & CreateWalletImportDispatchProps

export class CreateWalletImportComponent extends Component<CreateWalletImportProps, CreateWalletImportState> {
  constructor (props: CreateWalletImportProps) {
    super(props)
    this.state = {
      input: '',
      error: '',
      isProcessing: false,
      cleanedPrivateKey: ''
    }
  }

  onNext = async () => {
    const { selectedWalletType, currencyPlugin } = this.props
    const { input } = this.state
    this.setState({
      isProcessing: true
    })
    try {
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

  render () {
    const { error, isProcessing } = this.state
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.view}>
            <View style={styles.createWalletPromptArea}>
              <Text style={styles.instructionalText}>{s.strings.create_wallet_import_instructions}</Text>
            </View>
            <FormField
              style={[{ flex: 1, height: 150 }]}
              autoFocus
              clearButtonMode={'while-editing'}
              autoCorrect={false}
              onChangeText={this.onChangeText}
              label={s.strings.create_wallet_import_input_prompt}
              value={this.state.input}
              returnKeyType={'next'}
              onSubmitEditing={this.onNext}
              numberOfLines={5}
              multiline={true}
              error={error}
            />
            <View style={styles.buttons}>
              <PrimaryButton style={[styles.next]} onPress={this.onNext} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
              </PrimaryButton>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
