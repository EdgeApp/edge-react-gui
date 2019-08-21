// @flow

import { bns } from 'biggystring'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Keyboard, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import slowlog from 'react-native-slowlog'

import type { SetNativeAmountInfo } from '../../actions/CryptoExchangeActions.js'
import { createCryptoExchangeWalletSelectorModal } from '../../components/modals/CryptoExchangeWalletSelectorModal'
import CryptoExchangeMessageConnector from '../../connectors/components/CryptoExchangeMessageConnector'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import { CryptoExchangeFlipInputWrapperComponent } from '../../modules/UI/components/FlipInput/CryptoExchangeFlipInputWrapperComponent.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import { styles } from '../../styles/scenes/CryptoExchangeSceneStyles.js'
import type { State } from '../../types/reduxTypes.js'
import { type GuiCurrencyInfo, type GuiWallet, emptyCurrencyInfo } from '../../types/types.js'
import { getDenomFromIsoCode } from '../../util/utils.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

export type CryptoExchangeSceneComponentStateProps = {
  // The following props are used to populate the CryptoExchangeFlipInputs
  fromWallet: GuiWallet,
  fromExchangeAmount: string,
  fromPrimaryInfo: GuiCurrencyInfo,
  fromButtonText: string,
  fromFiatToCrypto: number,
  toWallet: GuiWallet,
  toExchangeAmount: string,
  toPrimaryInfo: GuiCurrencyInfo,
  toButtonText: string,
  toFiatToCrypto: number,

  // The following props are used to populate the confirmation modal
  fromCurrencyCode: string,
  fromCurrencyIcon: string,
  fromCurrencyIconDark: string,
  fromDisplayAmount: string,
  toCurrencyIcon: string,
  toCurrencyIconDark: string,
  toCurrencyCode: string,
  toDisplayAmount: string,

  // Number of times To and From wallets were flipped
  forceUpdateGuiCounter: number,
  shiftPendingTransaction: boolean,
  calculatingMax: boolean,
  wallets: { [string]: GuiWallet },
  totalWallets: number,
  supportedWalletTypes: Array<Object>,
  state: State,
  creatingWallet: boolean,
  defaultIsoFiat: string
}

export type CryptoExchangeSceneComponentDispatchProps = {
  onSelectWallet(string, string): void,
  openModal(data: 'from' | 'to'): mixed,
  getQuoteForTransaction(SetNativeAmountInfo): void,
  createCurrencyWallet(string, string, string): void
}

type Props = CryptoExchangeSceneComponentStateProps & CryptoExchangeSceneComponentDispatchProps

type LocalState = {
  whichWallet: string, // Which wallet selector dropdown was tapped
  whichWalletFocus: string, // Which wallet FlipInput was last focused and edited
  fromExchangeAmount: string,
  forceUpdateGuiCounter: number,
  toExchangeAmount: string
}

export class CryptoExchangeScene extends Component<Props, LocalState> {
  fromAmountNative: string
  fromAmountDisplay: string
  toAmountNative: string
  toAmountDisplay: string
  constructor (props: Props) {
    super(props)
    const newState: LocalState = {
      whichWallet: Constants.FROM,
      whichWalletFocus: Constants.FROM,
      forceUpdateGuiCounter: 0,
      fromExchangeAmount: '',
      toExchangeAmount: ''
    }
    this.state = newState
    slowlog(this, /.*/, global.slowlogOptions)
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (this.state.forceUpdateGuiCounter !== nextProps.forceUpdateGuiCounter) {
      this.setState({
        fromExchangeAmount: nextProps.fromExchangeAmount,
        toExchangeAmount: nextProps.toExchangeAmount,
        forceUpdateGuiCounter: nextProps.forceUpdateGuiCounter
      })
      this.fromAmountNative = bns.mul(nextProps.fromExchangeAmount, nextProps.fromPrimaryInfo.exchangeDenomination.multiplier)
      this.fromAmountDisplay = nextProps.fromExchangeAmount
    } else {
      // Check which wallet we are currently editing.
      // Only change the exchangeAmount of the opposite wallet to prevent feedback loops
      if (this.state.whichWalletFocus === Constants.FROM) {
        this.setState({ toExchangeAmount: nextProps.toExchangeAmount })
      } else if (this.state.whichWalletFocus === Constants.TO) {
        this.setState({ fromExchangeAmount: nextProps.fromExchangeAmount })
      }
    }
  }

  render () {
    let fromSecondaryInfo: GuiCurrencyInfo
    if (this.props.fromWallet) {
      fromSecondaryInfo = {
        displayCurrencyCode: this.props.fromWallet.fiatCurrencyCode,
        exchangeCurrencyCode: this.props.fromWallet.isoFiatCurrencyCode,
        displayDenomination: getDenomFromIsoCode(this.props.fromWallet.fiatCurrencyCode),
        exchangeDenomination: getDenomFromIsoCode(this.props.fromWallet.fiatCurrencyCode)
      }
    } else {
      fromSecondaryInfo = emptyCurrencyInfo
    }

    let toSecondaryInfo: GuiCurrencyInfo
    if (this.props.toWallet) {
      toSecondaryInfo = {
        displayCurrencyCode: this.props.toWallet.fiatCurrencyCode,
        exchangeCurrencyCode: this.props.toWallet.isoFiatCurrencyCode,
        displayDenomination: getDenomFromIsoCode(this.props.toWallet.fiatCurrencyCode),
        exchangeDenomination: getDenomFromIsoCode(this.props.toWallet.fiatCurrencyCode)
      }
    } else {
      toSecondaryInfo = emptyCurrencyInfo
    }
    const isFromFocused = this.state.whichWalletFocus === Constants.FROM
    const isToFocused = this.state.whichWalletFocus === Constants.TO
    return (
      <SceneWrapper>
        <KeyboardAwareScrollView
          style={[styles.mainScrollView]}
          keyboardShouldPersistTaps={Constants.ALWAYS}
          contentContainerStyle={styles.scrollViewContentContainer}
        >
          <CryptoExchangeMessageConnector style={styles.exchangeRateBanner} />
          <View style={styles.shim} />
          <CryptoExchangeFlipInputWrapperComponent
            style={styles.flipWrapper}
            guiWallet={this.props.fromWallet}
            buttonText={this.props.fromButtonText}
            currencyLogo={this.props.fromCurrencyIcon}
            primaryCurrencyInfo={this.props.fromPrimaryInfo}
            secondaryCurrencyInfo={fromSecondaryInfo}
            fiatPerCrypto={this.props.fromFiatToCrypto}
            overridePrimaryExchangeAmount={this.state.fromExchangeAmount}
            forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
            launchWalletSelector={this.launchFromWalletSelector}
            onCryptoExchangeAmountChanged={this.fromAmountChanged}
            isFocused={isFromFocused}
            focusMe={this.focusFromWallet}
          />
          <View style={styles.shim} />
          <Icon style={styles.downArrow} name={Constants.ARROW_DOWN_BOLD} size={styles.downArrowSize} type={Constants.MATERIAL_COMMUNITY} />
          <View style={styles.shim} />
          <CryptoExchangeFlipInputWrapperComponent
            style={styles.flipWrapper}
            guiWallet={this.props.toWallet}
            buttonText={this.props.toButtonText}
            currencyLogo={this.props.toCurrencyIcon}
            primaryCurrencyInfo={this.props.toPrimaryInfo}
            secondaryCurrencyInfo={toSecondaryInfo}
            fiatPerCrypto={this.props.toFiatToCrypto}
            overridePrimaryExchangeAmount={this.state.toExchangeAmount}
            forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
            launchWalletSelector={this.launchToWalletSelector}
            onCryptoExchangeAmountChanged={this.toAmountChanged}
            isFocused={isToFocused}
            isThinking={this.props.creatingWallet}
            focusMe={this.focusToWallet}
          />
          <View style={styles.shim} />
          <View style={styles.actionButtonContainer}>{this.renderButton()}</View>
          <View style={styles.shim} />
        </KeyboardAwareScrollView>
      </SceneWrapper>
    )
  }
  getQuote = () => {
    const data: SetNativeAmountInfo = {
      whichWallet: this.state.whichWalletFocus === Constants.FROM ? 'from' : 'to',
      primaryNativeAmount: this.state.whichWalletFocus === Constants.FROM ? this.fromAmountNative : this.toAmountNative
    }
    if (data.primaryNativeAmount && data.primaryNativeAmount !== '0') {
      this.props.getQuoteForTransaction(data)
      Keyboard.dismiss()
      return
    }
    Alert.alert(s.strings.no_exchange_amount, s.strings.select_exchange_amount)
  }
  renderButton = () => {
    if (this.props.calculatingMax) {
      return (
        <PrimaryButton>
          <ActivityIndicator />
        </PrimaryButton>
      )
    } else if (this.props.fromCurrencyCode !== '' && this.props.toCurrencyCode !== '') {
      return (
        <PrimaryButton onPress={this.getQuote}>
          <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
        </PrimaryButton>
      )
    }
    return null
  }

  launchFromWalletSelector = () => {
    this.props.openModal('from')
    this.renderDropUp(Constants.FROM)
    this.setState({
      whichWallet: Constants.FROM
    })
  }

  launchToWalletSelector = () => {
    this.props.openModal('to')
    this.renderDropUp(Constants.TO)
    this.setState({
      whichWallet: Constants.TO
    })
  }
  focusFromWallet = () => {
    this.setState({
      whichWallet: Constants.FROM,
      whichWalletFocus: Constants.FROM
    })
  }
  focusToWallet = () => {
    this.setState({
      whichWallet: Constants.TO,
      whichWalletFocus: Constants.TO
    })
  }

  fromAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.fromAmountNative = amounts.nativeAmount
    this.fromAmountDisplay = amounts.exchangeAmount
  }

  toAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.toAmountNative = amounts.nativeAmount
    this.toAmountDisplay = amounts.exchangeAmount
  }

  renderDropUp = (whichWallet: string) => {
    const { onSelectWallet, fromCurrencyCode, fromWallet, toCurrencyCode, toWallet, wallets } = this.props

    let excludedCurrencyCode = '' // should allow for multiple excluded currencyCodes
    // some complex logic because 'toCurrencyCode/fromCurrencyCode'
    // can be denomination (needs to change to actual currencyCode)
    if (whichWallet === Constants.TO) {
      if (fromWallet) {
        if (fromWallet.enabledTokens.length > 1) {
          // could be token
          excludedCurrencyCode = fromCurrencyCode
        } else {
          excludedCurrencyCode = fromWallet.currencyCode
        }
      }
    } else {
      if (toWallet) {
        if (toWallet.enabledTokens.length > 1) {
          // could be token
          excludedCurrencyCode = toCurrencyCode
        } else {
          excludedCurrencyCode = toWallet.currencyCode
        }
      }
    }
    const walletCurrencyCodes = []
    const allowedWallets = []
    for (const id in wallets) {
      const wallet = wallets[id]
      if (excludedCurrencyCode === wallet.currencyCode && excludedCurrencyCode === 'ETH' && wallet.enabledTokens.length > 0) {
        walletCurrencyCodes.push(wallet.currencyCode)
        if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
          allowedWallets.push(wallets[id])
        }
      }
      if (excludedCurrencyCode !== wallet.currencyCode) {
        walletCurrencyCodes.push(wallet.currencyCode)
        if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
          allowedWallets.push(wallets[id])
        }
      }
    }
    const supportedWalletTypes = []
    for (let i = 0; i < this.props.supportedWalletTypes.length; i++) {
      const swt = this.props.supportedWalletTypes[i]
      if (!walletCurrencyCodes.includes(swt.currencyCode) && swt.currencyCode !== 'EOS' && excludedCurrencyCode !== swt.currencyCode) {
        supportedWalletTypes.push(swt)
      }
    }
    const props = {
      wallets: allowedWallets,
      supportedWalletTypes,
      excludedCurrencyCode: [excludedCurrencyCode],
      showWalletCreators: whichWallet === Constants.TO,
      state: this.props.state,
      headerTitle: whichWallet === Constants.TO ? s.strings.select_recv_wallet : s.strings.select_src_wallet
    }
    const modal = createCryptoExchangeWalletSelectorModal(props)
    launchModal(modal, { style: { margin: 0 } }).then(response => {
      if (response) {
        if (response.id) {
          onSelectWallet(response.id, response.currencyCode)
          return
        }
        this.props.createCurrencyWallet(response.value, response.currencyCode, this.props.defaultIsoFiat)
      }
    })
    return null
  }
}
