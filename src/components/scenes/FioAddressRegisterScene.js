// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressIcon from '../../assets/images/list_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { DomainListModal } from '../../modules/FioAddress/components/DomainListModal'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { TextAndIconButton } from '../../modules/UI/components/Buttons/TextAndIconButton.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { MaterialInputOnWhite } from '../../styles/components/FormFieldStyles.js'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { styles as CryptoExchangeSceneStyle } from '../../styles/scenes/CryptoExchangeSceneStyles'
import { styles as fioAddressStyles } from '../../styles/scenes/FioAddressRegisterStyle'
import THEME from '../../theme/variables/airbitz'
import type { FioDomain } from '../../types/types'
import { scale } from '../../util/scaling.js'
import { FormField } from '../common/FormField.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'

export type State = {
  selectedWallet: EdgeCurrencyWallet | null,
  selectedDomain: FioDomain,
  fioAddress: string,
  isValid: boolean,
  touched: boolean,
  loading: boolean,
  walletLoading: boolean,
  isAvailable: boolean | null,
  replaceRegex: RegExp,
  fieldPos: number,
  inputWidth: number
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig,
  isConnected: boolean
}

export type DispatchProps = {
  createFioWallet: () => Promise<EdgeCurrencyWallet>
}

type Props = StateProps & DispatchProps

export class FioAddressRegisterScene extends Component<Props, State> {
  fioCheckQueue: number = 0
  clearButtonMode = 'while-editing'
  returnKeyType = 'next'
  inputMaxLength = 15

  state = {
    selectedWallet: null,
    selectedDomain: Constants.FIO_DOMAIN_DEFAULT,
    fioAddress: '',
    isValid: true,
    touched: false,
    isAvailable: false,
    loading: false,
    walletLoading: false,
    replaceRegex: new RegExp(`${Constants.FIO_ADDRESS_DELIMITER}${Constants.FIO_DOMAIN_DEFAULT.name}`),
    fieldPos: 200,
    inputWidth: scale(200)
  }

  componentDidMount() {
    const { fioWallets } = this.props
    this.getRegexFromDomain(Constants.FIO_DOMAIN_DEFAULT.name)
    if (fioWallets.length > 0) {
      this.setState({
        selectedWallet: fioWallets[0]
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
        selectedWallet: wallet,
        walletLoading: false
      })
    } catch (e) {
      this.setState({ walletLoading: false })
      showError(s.strings.create_wallet_failed_message)
    }
  }

  handleNextButton = () => {
    const { isConnected } = this.props
    const { fioAddress, selectedWallet, selectedDomain } = this.state
    if (isConnected) {
      if (!selectedWallet) return showError(s.strings.create_wallet_failed_message)
      const fullAddress = `${fioAddress}${Constants.FIO_ADDRESS_DELIMITER}${selectedDomain.name}`
      Actions[Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET]({ fioAddress: fullAddress, selectedWallet, selectedDomain })
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  checkFioAddress(fioAddress: string, domain: string) {
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
        const fullAddress = `${fioAddress}${Constants.FIO_ADDRESS_DELIMITER}${domain}`
        const isAvailable = fioPlugin.otherMethods ? await fioPlugin.otherMethods.validateAccount(fullAddress) : false
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
    this.checkFioAddress(fioAddressChanged, this.state.selectedDomain.name)

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
    let orStatement = ''
    let domainPart = ''
    for (const ch of domain) {
      domainPart += ch
      orStatement += `${domainPart}|`
    }
    this.setState({
      replaceRegex: new RegExp(`${Constants.FIO_ADDRESS_DELIMITER}?${Constants.FIO_ADDRESS_DELIMITER}(${orStatement.slice(0, orStatement.length - 1)})?`)
    })
  }

  handleFioWalletChange = (walletId: string) => {
    this.setState({
      selectedWallet: this.props.fioWallets.find(fioWallet => fioWallet.id === walletId)
    })
  }

  selectFioWallet = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={[Constants.FIO_STR]} />).then(
      (response: WalletListResult) => {
        if (response.walletToSelect) {
          if (response.walletToSelect.currencyCode === Constants.FIO_STR) {
            this.handleFioWalletChange(response.walletToSelect.walletId)
          } else {
            showError(`${s.strings.create_wallet_select_valid_crypto}: ${Constants.FIO_STR}`)
          }
        }
      }
    )
  }

  selectFioDomain = () => {
    Airship.show(bridge => <DomainListModal bridge={bridge} />).then((response: FioDomain | null) => {
      if (response) {
        this.setState({ selectedDomain: response })
        this.checkFioAddress(this.state.fioAddress, response.name)
      }
    })
  }

  domainOnLayout = (event: { nativeEvent: { layout: { x: number, y: number, width: number, height: number } } }) => {
    this.setState({ inputWidth: calcInputWidth(event.nativeEvent.layout.width) })
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
          style={[fioAddressStyles.statusIcon, fioAddressStyles.statusIconError]}
          type={Constants.MATERIAL_COMMUNITY}
          name={Constants.CLOSE_CIRCLE_ICON}
          size={25}
        />
      )
    }
    if (isValid && isAvailable && touched) {
      icon = (
        <Icon
          style={[fioAddressStyles.statusIcon, fioAddressStyles.statusIconOk]}
          type={Constants.MATERIAL_COMMUNITY}
          name={Constants.CHECK_CIRCLE_ICON}
          size={25}
        />
      )
    }

    return <View style={fioAddressStyles.statusIconContainer}>{loading ? <ActivityIndicator style={fioAddressStyles.statusIcon} size="small" /> : icon}</View>
  }

  renderFioWallets() {
    const { fioWallets } = this.props
    const { selectedWallet } = this.state
    if (fioWallets && fioWallets.length > 1) {
      const title = `${s.strings.title_fio_connect_to_wallet}: ${
        selectedWallet && selectedWallet.name ? selectedWallet.name : s.strings.fio_address_register_no_wallet_name
      }`
      return (
        <View style={styles.blockPadding}>
          <TextAndIconButton
            style={{ ...CryptoExchangeSceneStyle.flipWrapper.walletSelector, container: fioAddressStyles.selectWalletBtn }}
            onPress={this.selectFioWallet}
            icon={Constants.KEYBOARD_ARROW_DOWN}
            title={title}
          />
        </View>
      )
    }
  }

  render() {
    const { fioAddress, selectedDomain, touched, isAvailable, replaceRegex } = this.state
    let chooseHandleErrorMessage = ''
    if (touched && !this.props.isConnected) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_cant_check
    }
    if (touched && isAvailable === false) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_not_available
    }

    const materialInputOnWhiteStyle = {
      ...MaterialInputOnWhite,
      container: {
        ...MaterialInputOnWhite.container,
        ...fioAddressStyles.inputContainer,
        width: this.state.inputWidth
      }
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
              <View style={fioAddressStyles.formFieldViewContainer}>
                <FormField
                  style={materialInputOnWhiteStyle}
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
                  maxLength={this.inputMaxLength}
                  returnKeyType={this.returnKeyType}
                  error={chooseHandleErrorMessage}
                />
                <TouchableOpacity style={fioAddressStyles.domain} onPress={this.selectFioDomain}>
                  <View onLayout={this.domainOnLayout}>
                    <T style={fioAddressStyles.domainText}>
                      {Constants.FIO_ADDRESS_DELIMITER}
                      {selectedDomain.name}
                    </T>
                  </View>
                </TouchableOpacity>
              </View>
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

const calcInputWidth = (domainWidth: number) => fioAddressStyles.formFieldViewContainer.width - scale(33) - domainWidth
