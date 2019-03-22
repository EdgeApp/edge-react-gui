// @flow

import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { CREATE_WALLET_SELECT_FIAT } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import Text from '../../modules/UI/components/FormattedText'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { type GuiWalletType } from '../../types.js'
import { FormField } from '../common/FormField.js'

type CreateWalletImportState = {
  input: string,
  error: string,
  isProcessing: boolean,
  cleanedPrivateKey: string
}

type CreateWalletImportOwnProps = {
  selectedWalletType: GuiWalletType
}

type CreateWalletImportStateProps = {}

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
    const { selectedWalletType } = this.props
    const { input } = this.state
    Actions[CREATE_WALLET_SELECT_FIAT]({ selectedWalletType, cleanedPrivateKey: input })
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
              <PrimaryButton style={[styles.next]} onPress={this.onNext}>
                <PrimaryButton.Text>{isProcessing ? <ActivityIndicator /> : s.strings.submit}</PrimaryButton.Text>
              </PrimaryButton>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
