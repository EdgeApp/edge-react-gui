// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressIcon from '../../assets/images/list_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import { FIO_DOMAIN_DEFAULT } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { MaterialInput, MaterialInputOnWhite } from '../../styles/components/FormFieldStyles.js'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { styles as fioAddressStyles } from '../../styles/scenes/FioAddressRegisterStyle'
import THEME from '../../theme/variables/airbitz'
import { FormField } from '../common/FormField.js'
import { FormFieldSelect } from '../common/FormFieldSelect'
import { showError, showToast } from '../services/AirshipInstance'

export type State = {
  selectedWallet: { value: string | null, wallet: EdgeCurrencyWallet } | null,
  fioAddress: string,
  isValid: boolean,
  touched: boolean,
  loading: boolean,
  walletLoading: boolean,
  isAvailable: boolean | null,
  replaceRegex: RegExp,
  fieldPos: number
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig,
  isConnected: boolean
}

export type DispatchProps = {
  changeFioAddressName: (fioAddressName: string) => void,
  createFioWallet: () => Promise<EdgeCurrencyWallet>
}

type Props = StateProps & DispatchProps

export class FioAddressRegisterScene extends Component<Props, State> {
  fioCheckQueue: number = 0
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

  state = {
    selectedWallet: null,
    fioAddress: '',
    isValid: true,
    touched: false,
    isAvailable: false,
    loading: false,
    walletLoading: false,
    replaceRegex: new RegExp(`${FIO_DOMAIN_DEFAULT}`),
    fieldPos: 200
  }

  componentDidMount() {
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
    const { createFioWallet } = this.props
    showToast(s.strings.preparing_fio_wallet)
    this.setState({ walletLoading: true })
    try {
      const wallet = await createFioWallet()
      this.setState({
        selectedWallet: {
          value: wallet.name,
          wallet
        },
        walletLoading: false
      })
    } catch (e) {
      this.setState({ walletLoading: false })
      showError(s.strings.create_wallet_failed_message)
    }
  }

  handleNextButton = () => {
    const { changeFioAddressName, isConnected } = this.props
    const { fioAddress, selectedWallet } = this.state
    if (isConnected) {
      if (!selectedWallet) return showError(s.strings.create_wallet_failed_message)
      changeFioAddressName(fioAddress + FIO_DOMAIN_DEFAULT)
      Actions[Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET]({ selectedWallet })
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  checkFioAddress(fioAddress: string) {
    this.setState({
      loading: true
    })
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      try {
        const { fioPlugin } = this.props
        const isAvailable = fioPlugin.otherMethods ? await fioPlugin.otherMethods.validateAccount(fioAddress + FIO_DOMAIN_DEFAULT) : false
        this.setState({
          isAvailable,
          loading: false
        })
      } catch (e) {
        this.setState({
          loading: false
        })
      }
    }, 1000)
  }

  handleFioAddressChange = (fioAddressChanged: string) => {
    fioAddressChanged = fioAddressChanged.replace(this.state.replaceRegex, '')

    if (!this.props.isConnected) {
      return this.setState({
        fioAddress: fioAddressChanged,
        touched: true,
        isAvailable: null,
        loading: false
      })
    }
    this.checkFioAddress(fioAddressChanged)

    this.setState({
      fioAddress: fioAddressChanged.toLowerCase(),
      touched: true,
      isAvailable: null
    })
  }

  handleFioAddressFocus = () => {
    this.refs._scrollView.scrollTo({ x: 0, y: this.state.fieldPos, animated: true })
  }

  fieldViewOnLayout = () => {
    this.refs._fieldView.measure((x, y) => {
      this.setState({ fieldPos: y })
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

  renderButton() {
    const { isValid, isAvailable, loading, walletLoading } = this.state

    if (isValid && isAvailable && !loading) {
      return (
        <View style={styles.buttons}>
          <PrimaryButton style={styles.next} onPress={this.handleNextButton} disabled={!isAvailable || walletLoading}>
            {walletLoading ? <ActivityIndicator size="small" /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
      )
    }

    return null
  }

  renderLoader() {
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

    return <View style={fioAddressStyles.statusIcon}>{loading ? <ActivityIndicator style={styles.feedbackIcon} size="small" /> : icon}</View>
  }

  renderFioWallets() {
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

  render() {
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
        <ScrollView ref="_scrollView">
          <View style={styles.scrollableView}>
            <Image source={fioAddressIcon} style={fioAddressStyles.image} resizeMode="cover" />
            <View style={[styles.createWalletPromptArea, fioAddressStyles.paddings, fioAddressStyles.title]}>
              <T style={styles.instructionalText}>{s.strings.fio_address_first_screen_title}</T>
            </View>
            <View style={[styles.createWalletPromptArea, fioAddressStyles.paddings]}>
              <T style={styles.handleRequirementsText}>{s.strings.fio_address_features}</T>
            </View>
            <View style={[styles.createWalletPromptArea, fioAddressStyles.paddings]}>
              <T style={styles.handleRequirementsText}>{s.strings.fio_address_first_screen_end}</T>
            </View>

            <View style={fioAddressStyles.formFieldView} ref="_fieldView" onLayout={this.fieldViewOnLayout}>
              <FormField
                style={this.materialInputOnWhiteStyle}
                clearButtonMode={this.clearButtonMode}
                autoCorrect={false}
                autoCapitalize="none"
                placeholder={s.strings.fio_address_confirm_screen_label}
                caretHidden
                onFocus={this.handleFioAddressFocus}
                onChangeText={this.handleFioAddressChange}
                onSubmitEditing={this.handleNextButton}
                selectionColor={THEME.COLORS.ACCENT_MINT}
                label={s.strings.fio_address_choose_label}
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
