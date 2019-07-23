// @flow

import _ from 'lodash'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import { MAX_TOKEN_CODE_CHARACTERS } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import Text from '../../modules/UI/components/FormattedText/index'
import { styles } from '../../styles/scenes/AddTokenStyles.js'
import type { CustomTokenInfo, GuiWallet } from '../../types.js'
import { decimalPlacesToDenomination } from '../../util/utils.js'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

export type AddTokenOwnProps = {
  walletId: string,
  addTokenPending: Function,
  addNewToken: Function,
  currentCustomTokens: Array<CustomTokenInfo>,
  wallet: GuiWallet,
  onAddToken: Function,
  // adding properties in case coming from Scan scene (scan QR code to add token)
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  decimalPlaces: string
}

export type AddTokenDispatchProps = {
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string) => void
}

export type AddTokenStateProps = {
  addTokenPending: boolean,
  wallet: GuiWallet
}

type State = {
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  decimalPlaces: string,
  multiplier: string,
  enabled?: boolean
}

export type AddTokenProps = AddTokenOwnProps & AddTokenStateProps & AddTokenDispatchProps

export class AddToken extends Component<AddTokenProps, State> {
  constructor (props: AddTokenProps) {
    super(props)
    this.state = {
      currencyName: this.props.currencyName || '',
      currencyCode: this.props.currencyCode || '',
      contractAddress: this.props.contractAddress || '',
      decimalPlaces: this.props.decimalPlaces || '',
      multiplier: ''
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    const { addTokenPending } = this.props
    return (
      <SceneWrapper background="body">
        <ScrollView style={styles.container}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.addtoken_top_instructions}</Text>
          </View>
          <View style={styles.formArea}>
            <View style={[styles.nameArea]}>
              <FormField
                style={[styles.currencyName]}
                value={this.state.currencyName}
                onChangeText={this.onChangeName}
                autoCapitalize="words"
                autoFocus
                label={s.strings.addtoken_name_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.currencyCodeArea]}>
              <FormField
                style={[styles.currencyCodeInput]}
                value={this.state.currencyCode}
                onChangeText={this.onChangeCurrencyCode}
                autoCapitalize={'characters'}
                label={s.strings.addtoken_currency_code_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
                maxLength={MAX_TOKEN_CODE_CHARACTERS}
              />
            </View>
            <View style={[styles.contractAddressArea]}>
              <FormField
                style={[styles.contractAddressInput]}
                value={this.state.contractAddress}
                onChangeText={this.onChangeContractAddress}
                label={s.strings.addtoken_contract_address_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.decimalPlacesArea]}>
              <FormField
                style={[styles.decimalPlacesInput]}
                value={this.state.decimalPlaces}
                onChangeText={this.onChangeDecimalPlaces}
                label={s.strings.addtoken_denomination_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
                keyboardType={'numeric'}
              />
            </View>
          </View>
          <View style={[styles.buttonsArea]}>
            <PrimaryButton style={styles.saveButton} onPress={this._onSave}>
              {addTokenPending ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>}
            </PrimaryButton>
          </View>
          <View style={styles.bottomPaddingForKeyboard} />
        </ScrollView>
      </SceneWrapper>
    )
  }

  onChangeName = (input: string) => {
    this.setState({
      currencyName: input
    })
  }

  onChangeCurrencyCode = (input: string) => {
    this.setState({
      currencyCode: input
    })
  }

  onChangeDecimalPlaces = (input: string) => {
    this.setState({
      decimalPlaces: input
    })
  }

  onChangeContractAddress = (input: string) => {
    this.setState({
      contractAddress: input.trim()
    })
  }

  _onSave = () => {
    const currencyCode = this.state.currencyCode.toUpperCase()
    this.setState(
      {
        currencyCode
      },
      () => {
        const { currencyName, decimalPlaces, contractAddress } = this.state
        const { currentCustomTokens, wallet, walletId } = this.props
        const currentCustomTokenIndex = _.findIndex(currentCustomTokens, item => item.currencyCode === currencyCode)
        const metaTokensIndex = _.findIndex(wallet.metaTokens, item => item.currencyCode === currencyCode)
        // if token is hard-coded into wallets of this type
        if (metaTokensIndex >= 0) Alert.alert(s.strings.manage_tokens_duplicate_currency_code)
        // if that token already exists and is visible (ie not deleted)
        if (currentCustomTokenIndex >= 0 && currentCustomTokens[currentCustomTokenIndex].isVisible !== false) {
          Alert.alert(s.strings.manage_tokens_duplicate_currency_code)
        } else {
          if (currencyName && currencyCode && decimalPlaces && contractAddress) {
            const denomination = decimalPlacesToDenomination(decimalPlaces)
            this.props.addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination)
            this.props.onAddToken(currencyCode)
          } else {
            Alert.alert(s.strings.addtoken_invalid_information)
          }
        }
      }
    )
  }
}
