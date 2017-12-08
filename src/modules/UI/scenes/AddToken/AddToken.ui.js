// @flow

import React, {Component} from 'react'
import {
  View,
  ActivityIndicator
} from 'react-native'
import Text from '../../components/FormattedText'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import styles from './style.js'
import {PrimaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'
import * as UTILS from '../../../utils.js'

type State = {
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  decimalPlaces: string,
  errorMessage: string
}
type Props = {
  walletId: string,
  addTokenPending: Function,
  addToken: Function
}

export default class AddToken extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      currencyName: '',
      currencyCode: '',
      contractAddress: '',
      decimalPlaces: '',
      errorMessage: ''
    }
  }

  render () {
    return (
      <View style={[styles.addTokens]}>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.addtoken_top_instructions}</Text>
          </View>
          <View style={styles.formArea}>
            <View style={[styles.nameArea, UTILS.border()]}>
              <FormField
                style={[styles.currencyName]}
                value={this.state.currencyName}
                onChangeText={this.onChangeName}
                autoCapitalize={'words'}
                autoFocus
                label={s.strings.addtoken_name_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.currencyCodeArea ,UTILS.border()]}>
              <FormField
                style={[styles.currencyCodeInput]}
                value={this.state.currencyCode}
                onChangeText={this.onChangeCurrencyCode}
                autoCapitalize={'characters'}
                label={s.strings.addtoken_currency_code_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.contractAddressArea ,UTILS.border()]}>
              <FormField
                style={[styles.contractAddressInput]}
                value={this.state.contractAddress}
                onChangeText={this.onChangeContractAddress}
                label={s.strings.addtoken_contract_address_input_text}
                returnKeyType={'done'}
                autoCorrect={false}
              />
            </View>
            <View style={[styles.decimalPlacesArea ,UTILS.border()]}>
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
          <View style={styles.errorMessageArea}>
            <Text style={styles.errorMessageText}>{this.state.errorMessage}</Text>
          </View>
          <View style={[styles.buttonsArea, UTILS.border()]}>
            <PrimaryButton
              text={'Save'}
              style={styles.saveButton}
              onPressFunction={this._onSave}
              processingElement={<ActivityIndicator />}
              processingFlag={this.props.addTokenPending}
            />
          </View>
        </View>
      </View>
    )
  }

  onChangeName = (input: string) => {
    this.setState({
      currencyName: input
    })
  }

  onChangeCurrencyCode = (input: string) => {
    this.setState({
      currencyCode: input.substring(0,5)
    })
  }

  onChangeDecimalPlaces = (input: string) => {
    this.setState({
      decimalPlaces: input
    })
  }

  onChangeContractAddress = (input: string) => {
    this.setState({
      contractAddress: input
    })
  }

  _onSave = () => {
    const {currencyName, currencyCode, decimalPlaces, contractAddress} = this.state
    if (currencyName && currencyCode && decimalPlaces && contractAddress) {
      const {walletId} = this.props
      const numberOfDecimalPlaces = parseInt(this.state.decimalPlaces)
      const multiplier = '1' + '0'.repeat(numberOfDecimalPlaces)
      let tokenObj: any = this.state
      tokenObj.multiplier = multiplier
      this.props.addToken(walletId, tokenObj)
    } else {
      this.setState({
        errorMessage: s.strings.addtoken_default_error_message
      })
    }
  }
}
