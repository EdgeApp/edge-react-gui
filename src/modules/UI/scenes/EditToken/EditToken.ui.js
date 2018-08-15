// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import _ from 'lodash'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native'

import { FormField } from '../../../../components/FormField.js'
import { DELETE, MAX_TOKEN_CODE_CHARACTERS } from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import type { CustomTokenInfo } from '../../../../types.js'
import * as UTILS from '../../../utils'
import { PrimaryButton, TertiaryButton } from '../../components/Buttons'
import Text from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
// import * as WALLET_ACTIONS from '../../Wallets/action.js'
import StylizedModal from '../../components/Modal/Modal.ui'
import OptionIcon from '../../components/OptionIcon/OptionIcon.ui'
import SafeAreaView from '../../components/SafeAreaView'
import DeleteTokenButtons from './components/DeleteTokenButtons.ui.js'
import styles from './style.js'

export type EditTokenDispatchProps = {
  showDeleteTokenModal: () => void,
  hideDeleteTokenModal: () => void,
  deleteCustomToken: (walletId: string, currencyCode: string) => void,
  editCustomToken: (
    walletId: string,
    currencyName: string,
    currencyCode: string,
    contractAddress: string,
    denomination: string,
    oldCurrencyCode: string
  ) => void
}

export type EditTokenStateProps = {
  customTokens: Array<CustomTokenInfo>,
  deleteTokenModalVisible: boolean,
  editCustomTokenProcessing: boolean,
  deleteCustomTokenProcessing: boolean
}

export type EditTokenOwnProps = {
  walletId: string,
  addTokenPending: boolean,
  currencyCode: string,
  metaTokens: Array<EdgeMetaToken>,
  onDeleteToken: string => void
}

type State = {
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  decimalPlaces: string,
  multiplier: string,
  errorMessage: string,
  enabled?: boolean
}

export type EditTokenComponentProps = EditTokenDispatchProps & EditTokenOwnProps & EditTokenStateProps

export default class EditToken extends Component<EditTokenComponentProps, State> {
  constructor (props: EditTokenComponentProps) {
    super(props)
    const tokenInfoIndex = _.findIndex(props.customTokens, item => item.currencyCode === props.currencyCode)
    if (tokenInfoIndex >= 0) {
      const tokenInfo = props.customTokens[tokenInfoIndex]
      const { currencyName, contractAddress, denomination } = tokenInfo
      const decimalPlaces = UTILS.denominationToDecimalPlaces(denomination)
      this.state = {
        currencyName,
        contractAddress,
        decimalPlaces,
        multiplier: '',
        currencyCode: props.currencyCode,
        errorMessage: ''
      }
    } else {
      Alert.alert(s.strings.edittoken_delete_title, s.strings.edittoken_improper_token_load)
    }
  }

  render () {
    const { editCustomTokenProcessing } = this.props
    return (
      <SafeAreaView>
        <View style={[styles.editTokens]}>
          <Gradient style={styles.gradient} />
          <StylizedModal
            headerText={s.strings.edittoken_delete_prompt}
            visibilityBoolean={this.props.deleteTokenModalVisible}
            featuredIcon={<OptionIcon iconName={DELETE} style={styles.deleteIcon} />}
            modalBottom={
              <DeleteTokenButtons
                onPressDelete={this.deleteToken}
                onPressCancel={() => this.props.hideDeleteTokenModal()}
                processingFlag={this.props.deleteCustomTokenProcessing}
              />
            }
            onExitButtonFxn={() => this.props.hideDeleteTokenModal()}
          />
          <ScrollView style={styles.container}>
            <View style={styles.instructionalArea}>
              <Text style={styles.instructionalText}>{s.strings.edittoken_top_instructions}</Text>
            </View>
            <View style={styles.formArea}>
              <View style={[styles.nameArea]}>
                <FormField
                  style={[styles.currencyName]}
                  value={this.state.currencyName}
                  onChangeText={this.onChangeName}
                  autoCapitalize={'words'}
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
            <View style={styles.errorMessageArea}>
              <Text style={styles.errorMessageText}>{this.state.errorMessage}</Text>
            </View>
            <View style={[styles.buttonsArea]}>
              <TertiaryButton onPress={this.props.showDeleteTokenModal} style={[styles.deleteButton]}>
                <TertiaryButton.Text>{s.strings.edittoken_delete_token}</TertiaryButton.Text>
              </TertiaryButton>
              <PrimaryButton style={[styles.saveButton]} onPress={this._onSave}>
                {editCustomTokenProcessing ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>}
              </PrimaryButton>
            </View>
            <View style={styles.bottomPaddingForKeyboard} />
          </ScrollView>
        </View>
      </SafeAreaView>
    )
  }

  showDeleteTokenModal = () => {
    this.props.showDeleteTokenModal()
  }

  deleteToken = () => {
    const { walletId, currencyCode } = this.props
    this.props.deleteCustomToken(walletId, currencyCode)
    this.props.onDeleteToken(currencyCode)
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
        if (currencyName && currencyCode && decimalPlaces && contractAddress) {
          const { walletId } = this.props
          const visibleTokens = UTILS.mergeTokensRemoveInvisible(this.props.metaTokens, this.props.customTokens)
          const indexInVisibleTokens = _.findIndex(visibleTokens, token => token.currencyCode === currencyCode)
          if (currencyCode !== this.props.currencyCode) {
            // if the currencyCode will change
            if (indexInVisibleTokens >= 0) {
              // if the new currency code is already taken / visible
              Alert.alert(s.strings.edittoken_delete_title, s.strings.edittoken_duplicate_currency_code)
            } else {
              // not in the array of visible tokens, CASE 3
              if (parseInt(decimalPlaces) !== 'NaN') {
                const denomination = UTILS.decimalPlacesToDenomination(decimalPlaces)
                this.props.editCustomToken(walletId, currencyName, currencyCode, contractAddress, denomination, this.props.currencyCode)
              } else {
                Alert.alert(s.strings.edittoken_delete_title, s.strings.edittoken_invalid_decimal_places)
              }
            }
          } else {
            if (parseInt(decimalPlaces) !== 'NaN') {
              const denomination = UTILS.decimalPlacesToDenomination(decimalPlaces)
              this.props.editCustomToken(walletId, currencyName, currencyCode, contractAddress, denomination, this.props.currencyCode)
            } else {
              Alert.alert(s.strings.edittoken_delete_title, s.strings.edittoken_invalid_decimal_places)
            }
          }
        } else {
          Alert.alert(s.strings.edittoken_delete_title, s.strings.addtoken_default_error_message)
        }
      }
    )
  }
}
