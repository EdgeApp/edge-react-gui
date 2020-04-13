// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressIcon from '../../assets/images/list_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import { FIO_DOMAIN_DEFAULT } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { MaterialInput, MaterialInputOnWhite } from '../../styles/components/FormFieldStyles.js'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { styles as fioAddressStyles } from '../../styles/scenes/FioAddressRegisterStyle'
import THEME from '../../theme/variables/airbitz'
import { FormField } from '../common/FormField.js'
import { FormFieldSelect } from '../common/FormFieldSelect'
import { showError } from '../services/AirshipInstance'

export type State = {
  selectedWallet: { value: string | null, wallet: EdgeCurrencyWallet } | null,
  fioAddress: string,
  isValid: boolean,
  touched: boolean,
  loading: boolean,
  isAvailable: boolean | null,
  replaceRegex: RegExp
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig,
  defaultFiatCode: string,
  isConnected: boolean
}

export type DispatchProps = {
  changeFioAddressName: (fioAddressName: string) => void,
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string) => any
}

type Props = StateProps & DispatchProps

export class FioAddressRegisterScene extends Component<Props, State> {
  clearButtonMode = 'while-editing'
  returnKeyType = 'next'
  inputMaxLength = 15
  selectInputStyle = {
    ...MaterialInput,
    container: {
      ...MaterialInput.container,
      width: '100%'
    },
    baseColor: THEME.COLORS.PRIMARY,
    textColor: THEME.COLORS.PRIMARY
  }
  materialInputOnWhiteStyle = {
    ...MaterialInputOnWhite,
    container: {
      ...MaterialInputOnWhite.container,
      ...fioAddressStyles.inputContainer
    }
  }
  bcValidationTimer: TimeoutID | null

  state = {
    selectedWallet: null,
    fioAddress: '',
    isValid: true,
    touched: false,
    isAvailable: false,
    loading: false,
    replaceRegex: new RegExp(`${FIO_DOMAIN_DEFAULT}`)
  }

  componentDidMount () {
    const { fioWallets } = this.props
    this.getRegexFromDomain(FIO_DOMAIN_DEFAULT)
    if (fioWallets.length > 0) {
      this.setState({
        selectedWallet: {
          value: fioWallets[0].name,
          wallet: fioWallets[0]
        }
      })
    } else {
      this.createFioWallet()
    }
  }

  createFioWallet = async (): Promise<void> => {
    const { createCurrencyWallet, defaultFiatCode } = this.props
    try {
      const wallet = await createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, Constants.FIO_WALLET_TYPE, defaultFiatCode)
      this.setState({
        selectedWallet: {
          value: wallet.name,
          wallet
        }
      })
    } catch (e) {
      //
    }
  }

  handleNextButton = () => {
    const { changeFioAddressName, isConnected } = this.props
    const { fioAddress, selectedWallet } = this.state
    if (isConnected) {
      changeFioAddressName(fioAddress + FIO_DOMAIN_DEFAULT)
      Actions[Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET]({ selectedWallet })
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  handleFioAddressChange = async (fioAddressChanged: string) => {
    fioAddressChanged = fioAddressChanged.replace(this.state.replaceRegex, '')
    this.setState({
      loading: true
    })

    if (this.bcValidationTimer) {
      clearTimeout(this.bcValidationTimer)
      this.bcValidationTimer = null
    }
    if (!this.props.isConnected) {
      return this.setState({
        fioAddress: fioAddressChanged,
        touched: true,
        isAvailable: null,
        loading: false
      })
    }
    const { fioPlugin } = this.props
    this.bcValidationTimer = window.requestAnimationFrame(async () => {
      const isAvailable = fioPlugin.otherMethods ? await fioPlugin.otherMethods.validateAccount(fioAddressChanged + FIO_DOMAIN_DEFAULT) : false
      this.setState({
        isAvailable,
        loading: false
      })
    })

    this.setState({
      fioAddress: fioAddressChanged,
      touched: true,
      isAvailable: null,
      loading: false
    })
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

  handleFioWalletChange = (value: string, index: number, data: Object) => {
    this.setState({
      selectedWallet: data[index]
    })
  }

  renderButton () {
    const { isValid, isAvailable, loading } = this.state

    if (isValid && isAvailable && !loading) {
      return (
        <View style={styles.buttons}>
          <PrimaryButton style={[styles.next]} onPress={this.handleNextButton} disabled={!isAvailable}>
            <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
          </PrimaryButton>
        </View>
      )
    }

    return null
  }

  renderLoader () {
    const { isValid, touched, isAvailable, loading } = this.state

    let icon = null
    if ((!isValid || isAvailable === false) && touched) {
      icon = (
        <Icon
          style={[styles.feedbackIcon, fioAddressStyles.statusIconError]}
          type={Constants.MATERIAL_COMMUNITY}
          name={Constants.CLOSE_CIRCLE_ICON}
          size={25}
        />
      )
    }
    if (isValid && isAvailable && touched) {
      icon = (
        <Icon style={[styles.feedbackIcon, fioAddressStyles.statusIconOk]} type={Constants.MATERIAL_COMMUNITY} name={Constants.CHECK_CIRCLE_ICON} size={25} />
      )
    }

    return <View style={fioAddressStyles.statusIcon}>{loading ? <ActivityIndicator style={styles.feedbackIcon} /> : icon}</View>
  }

  renderFioWallets () {
    const { fioWallets } = this.props
    const { selectedWallet } = this.state
    if (fioWallets && fioWallets.length > 1) {
      return (
        <View style={styles.blockPadding}>
          <View>
            <FormFieldSelect
              style={this.selectInputStyle}
              onChangeText={this.handleFioWalletChange}
              label={s.strings.fio_address_register_select_wallet}
              value={selectedWallet ? selectedWallet.value || '' : ''}
              data={fioWallets.map(wallet => ({
                value: wallet.name ? wallet.name : s.strings.fio_address_register_no_wallet_name,
                wallet
              }))}
            />
          </View>
        </View>
      )
    }
  }

  render () {
    const { fioAddress, touched, isAvailable, replaceRegex } = this.state

    let chooseHandleErrorMessage = ''
    if (touched && !this.props.isConnected) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_cant_check
    }
    if (touched && isAvailable === false) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_not_available
    }

    return (
      <SafeAreaView>
        <Gradient style={styles.scrollableGradient} />
        <ScrollView>
          <View style={[styles.scrollableView]}>
            <Image source={fioAddressIcon} style={fioAddressStyles.image} resizeMode={'cover'} />
            <View style={[styles.createWalletPromptArea, fioAddressStyles.paddings, fioAddressStyles.title]}>
              <T style={styles.instructionalText}>{s.strings.fio_address_first_screen_title}</T>
            </View>
            <View style={[styles.createWalletPromptArea, fioAddressStyles.paddings]}>
              <T style={styles.handleRequirementsText}>{s.strings.fio_address_features}</T>
            </View>
            <View style={[styles.createWalletPromptArea, fioAddressStyles.paddings]}>
              <T style={styles.handleRequirementsText}>{s.strings.fio_address_first_screen_end}</T>
            </View>

            <View style={fioAddressStyles.formFieldView}>
              <FormField
                style={this.materialInputOnWhiteStyle}
                clearButtonMode={this.clearButtonMode}
                autoCorrect={false}
                placeholder={s.strings.fio_address_confirm_screen_label}
                caretHidden={true}
                onChangeText={this.handleFioAddressChange}
                onSubmitEditing={this.handleNextButton}
                selectionColor={THEME.COLORS.ACCENT_MINT}
                label={s.strings.fio_address_confirm_screen_label}
                value={fioAddress.replace(replaceRegex, '')}
                suffix={FIO_DOMAIN_DEFAULT}
                maxLength={this.inputMaxLength}
                returnKeyType={this.returnKeyType}
                error={chooseHandleErrorMessage}
              />
              {this.renderLoader()}
            </View>

            {this.renderFioWallets()}
            {this.renderButton()}
            <View style={fioAddressStyles.bottomSpace} />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}
