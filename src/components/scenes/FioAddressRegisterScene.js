// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import { FIO_DOMAIN_DEFAULT, FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { MaterialInputOnWhite } from '../../styles/components/FormFieldStyles.js'
import styles from '../../styles/scenes/FioAddressRegisterStyle'
import THEME from '../../theme/variables/airbitz'
import type { IsConnectedProp } from '../../types/types'
import { FormField } from '../common/FormField.js'
import { showError } from '../services/AirshipInstance'

export type State = {
  fioAddress: string,
  isValid: boolean,
  touched: boolean,
  isAvailable: boolean | null,
  replaceRegex: RegExp
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  defaultFiatCode: string,
  isConnected: boolean
}

export type DispatchProps = {
  changeFioAddressName: (fioAddressName: string) => void,
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string) => any
}

type Props = StateProps & IsConnectedProp & DispatchProps

export class FioAddressRegisterScene extends Component<Props, State> {
  clearButtonMode = 'while-editing'
  returnKeyType = 'next'
  inputMaxLength = 15

  state = {
    fioAddress: '',
    isValid: false,
    touched: false,
    isAvailable: false,
    replaceRegex: new RegExp(`${FIO_DOMAIN_DEFAULT}`)
  }

  wallet: EdgeCurrencyWallet | null
  bcValidationTimer: TimeoutID | null

  async componentDidMount () {
    const { fioWallets } = this.props
    if (fioWallets.length === 0) {
      this.wallet = await this.createFioWallet()
    } else {
      this.wallet = fioWallets[0]
    }
    this.getRegexFromDomain(FIO_DOMAIN_DEFAULT)
  }

  createFioWallet = async (): Promise<EdgeCurrencyWallet | null> => {
    const { createCurrencyWallet, defaultFiatCode } = this.props
    try {
      return await createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, FIO_WALLET_TYPE, defaultFiatCode)
    } catch (e) {
      return null
    }
  }

  handleNextButton = () => {
    const { changeFioAddressName, isConnected } = this.props
    const { fioAddress } = this.state
    if (isConnected) {
      changeFioAddressName(fioAddress + FIO_DOMAIN_DEFAULT)
      Actions[Constants.FIO_ADDRESS_CONFIRM]()
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  handleFioAddressChange = async (fioAddressChanged: string) => {
    if (!this.wallet) {
      return this.setState({
        isAvailable: null
      })
    }
    fioAddressChanged = fioAddressChanged.replace(this.state.replaceRegex, '')
    const fioAddressLength = fioAddressChanged.length
    const regexValidation = this.wallet ? await this.wallet.otherMethods.validateFioAddress(fioAddressChanged + FIO_DOMAIN_DEFAULT) : false

    const isValid = !(fioAddressLength === 0 || fioAddressLength > 20 - 5 || !regexValidation)

    if (this.bcValidationTimer) {
      clearTimeout(this.bcValidationTimer)
      this.bcValidationTimer = null
    }
    if (!this.props.isConnected) {
      this.setState({
        fioAddress: fioAddressChanged,
        isValid: false,
        touched: true,
        isAvailable: null
      })
      return
    }
    if (isValid) {
      this.bcValidationTimer = window.requestAnimationFrame(async () => {
        const isUnavailable = await this.validateAddressNetwork(fioAddressChanged + FIO_DOMAIN_DEFAULT)
        this.setState({
          isAvailable: !isUnavailable
        })
      })
    }

    this.setState({
      fioAddress: fioAddressChanged,
      isValid,
      touched: true,
      isAvailable: null
    })
  }

  validateAddressNetwork = async (fioAddress: string): Promise<boolean> => {
    try {
      if (this.wallet) {
        const obj = await this.wallet.otherMethods.fioAction('isAvailable', { fioName: fioAddress })
        return !!obj.is_registered
      }
      return false
    } catch (e) {
      return false
    }
  }

  getRegexFromDomain = (domain: string) => {
    domain = domain.replace('@', '')
    let orStatement = ''
    let domainPart = ''
    for (const ch of domain) {
      domainPart += ch
      orStatement += `${domainPart}|`
    }
    this.setState({ replaceRegex: new RegExp(`@?@(${orStatement.slice(0, orStatement.length - 1)})?`) })
  }

  render () {
    const { fioAddress, isValid, touched, isAvailable, replaceRegex } = this.state
    const MaterialInputOnWhiteStyle = {
      ...MaterialInputOnWhite,
      container: {
        ...MaterialInputOnWhite.container,
        ...styles.inputContainer
      }
    }

    return (
      <SafeAreaView>
        <Gradient style={styles.view}>
          <View style={styles.icon}>
            <Image source={fioAddressDetailsIcon} style={styles.image} />
          </View>
        </Gradient>
        <View style={styles.mainView}>
          <View style={styles.text}>
            <T>{s.strings.fio_address_register_screen_label}</T>
          </View>
          <View style={styles.formField}>
            <FormField
              style={MaterialInputOnWhiteStyle}
              autoFocus
              clearButtonMode={this.clearButtonMode}
              autoCorrect={false}
              placeholder={s.strings.fio_address_register_form_field_label}
              caretHidden={true}
              onChangeText={this.handleFioAddressChange}
              onSubmitEditing={this.handleNextButton}
              selectionColor={THEME.COLORS.ACCENT_MINT}
              label={s.strings.fio_address_register_form_field_label}
              value={fioAddress.replace(replaceRegex, '')}
              suffix={FIO_DOMAIN_DEFAULT}
              maxLength={this.inputMaxLength}
              returnKeyType={this.returnKeyType}
            />
            {(!isValid || isAvailable === false) && touched && (
              <Icon style={styles.statusIconError} type={Constants.MATERIAL_COMMUNITY} name={Constants.CLOSE_CIRCLE_ICON} size={30} />
            )}
            {isValid && isAvailable && touched && (
              <Icon style={styles.statusIconOk} type={Constants.MATERIAL_COMMUNITY} name={Constants.CHECK_CIRCLE_ICON} size={30} />
            )}
          </View>
          <View style={styles.status}>
            {!isValid && !this.props.isConnected && touched && <T style={styles.notAvailable}>{s.strings.fio_address_register_screen_cant_check}</T>}
            {isValid && isAvailable === false && touched && <T style={styles.notAvailable}>{s.strings.fio_address_register_screen_not_available}</T>}
            {isValid && isAvailable && touched && <T style={styles.available}>{s.strings.fio_address_register_screen_available}</T>}
            {!isValid && this.props.isConnected && touched && <T style={styles.notAvailable}>{s.strings.fio_address_register_screen_invalid}</T>}
          </View>
          {isValid && isAvailable && (
            <View style={styles.nextButton}>
              <Button onPress={this.handleNextButton} style={styles.toggleButton} underlayColor={styles.underlay.color}>
                <Button.Center>
                  <Button.Text>
                    <T>{s.strings.string_next_capitalized}</T>
                  </Button.Text>
                </Button.Center>
              </Button>
            </View>
          )}
        </View>
      </SafeAreaView>
    )
  }
}
