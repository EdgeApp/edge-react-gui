// @flow

import { type EdgeCurrencyPlugin } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import CheckIcon from '../../assets/images/createWallet/check_icon_lg.png'
import { CREATE_WALLET_SELECT_FIAT } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import Text from '../../modules/UI/components/FormattedText'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { type GuiWalletType } from '../../types.js'
import { FormField } from '../common/FormField.js'
import { FullScreenTransitionComponent } from '../common/FullScreenTransition.js'

type CreateWalletImportState = {
  input: string,
  error: string,
  isProcessing: boolean,
  cleanedPrivateKey: string,
  isTransitionVisible: boolean
}

type CreateWalletImportOwnProps = {
  selectedWalletType: GuiWalletType
}

type CreateWalletImportStateProps = {
  currencyPlugin: EdgeCurrencyPlugin
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
      isTransitionVisible: false,
      cleanedPrivateKey: ''
    }
  }

  onNext = async () => {
    const { selectedWalletType, currencyPlugin } = this.props
    const { input } = this.state
    // $FlowFixMe
    const cleanedPrivateKey = await currencyPlugin.currencyTools.cleanPrivateKey(input, selectedWalletType.currencyCode)
    this.setState({
      isTransitionVisible: true,
      cleanedPrivateKey
    })
  }

  onChangeText = (input: string) => {
    this.setState({ input })
  }

  render () {
    const { selectedWalletType } = this.props
    const { error, isProcessing, isTransitionVisible, cleanedPrivateKey } = this.state
    return (
      <SafeAreaView>
        {!isTransitionVisible ? (
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
        ) : (
          <FullScreenTransitionComponent
            onDone={() => Actions[CREATE_WALLET_SELECT_FIAT]({ selectedWalletType, cleanedPrivateKey })}
            image={<Image source={CheckIcon} style={[styles.currencyLogo, { marginBottom: 36 }]} resizeMode={'cover'} />}
            text={<Text style={styles.createWalletImportTransitionText}>{s.strings.create_wallet_import_successful}</Text>}
          />
        )}
      </SafeAreaView>
    )
  }
}
