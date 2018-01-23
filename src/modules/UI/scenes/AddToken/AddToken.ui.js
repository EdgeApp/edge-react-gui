// @flow

import React, {Component} from 'react'
import {connect} from 'react-redux'
import {
  View,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native'
import Text from '../../components/FormattedText'
import SafeAreaView from '../../components/SafeAreaView'
import s from '../../../../locales/strings.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import styles from './style.js'
import {PrimaryButton} from '../../components/Buttons'
import {FormField} from '../../../../components/FormField.js'
import * as ADD_TOKEN_ACTIONS from './action.js'
import type {AbcMetaToken} from 'airbitz-core-types'
import _ from 'lodash'
import {decimalPlacesToDenomination} from '../../../utils.js'
import type { CustomTokenInfo, GuiWallet } from '../../../../types'
import {
  getWallet
} from '../../selectors'

export type DispatchProps = {
  addNewToken: (string, string, string, string, string) => void
}

export type State = {
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  decimalPlaces: string,
  multiplier: string,
  enabled?: boolean
}

export type Props = {
  walletId: string,
  addTokenPending: Function,
  addNewToken: Function,
  currentCustomTokens: Array<CustomTokenInfo>,
  wallet: GuiWallet
}

class AddToken extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      currencyName: '',
      currencyCode: '',
      contractAddress: '',
      decimalPlaces: '',
      multiplier: ''
    }
  }

  render () {
    return (
      <SafeAreaView>
      <View style={[styles.addTokens]}>
        <Gradient style={styles.gradient} />
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
                autoCapitalize='words'
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
            <PrimaryButton
              text={s.strings.string_save}
              style={styles.saveButton}
              onPressFunction={this._onSave}
              processingElement={<ActivityIndicator />}
              processingFlag={this.props.addTokenPending}
            />
          </View>
          <View style={styles.bottomPaddingForKeyboard} />
        </ScrollView>
      </View>
    </SafeAreaView>
    )
  }

  onChangeName = (input: string) => {
    this.setState({
      currencyName: input
    })
  }

  onChangeCurrencyCode = (input: string) => {
    this.setState({
      currencyCode: input.substring(0, 5)
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
    const {currencyName, currencyCode, decimalPlaces, contractAddress} = this.state
    const {currentCustomTokens, wallet, walletId} = this.props
    const currentCustomTokenIndex = _.findIndex(currentCustomTokens, (item) => item.currencyCode === currencyCode)
    const metaTokensIndex = _.findIndex(wallet.metaTokens, (item) => item.currencyCode === currencyCode)
    // if token is hard-coded into wallets of this type
    if (metaTokensIndex >= 0) Alert.alert(s.strings.manage_tokens_duplicate_currency_code)
    // if that token already exists and is visible (ie not deleted)
    if (currentCustomTokenIndex >= 0 && currentCustomTokens[currentCustomTokenIndex].isVisible !== false) {
      Alert.alert(s.strings.manage_tokens_duplicate_currency_code)
    } else {
      if (currencyName && currencyCode && decimalPlaces && contractAddress) {
        const denomination = decimalPlacesToDenomination(decimalPlaces)
        this.props.addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination)
      } else {
        Alert.alert(s.strings.addtoken_invalid_information)
      }
    }
  }
}

const mapStateToProps = (state: any, ownProps: any) => ({
  addTokenPending: state.ui.wallets.addTokenPending,
  walletId: ownProps.walletId,
  currentCustomTokens: state.ui.settings.customTokens,
  wallet: getWallet(state, ownProps.walletId)
})

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  dispatch,
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string) => dispatch(ADD_TOKEN_ACTIONS.addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination))
})

export default connect(mapStateToProps, mapDispatchToProps)(AddToken)
