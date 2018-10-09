// @flow

import React, { Component } from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import slowlog from 'react-native-slowlog'

import type { SetNativeAmountInfo } from '../../../../actions/CryptoExchangeActions.js'
import CryptoExchangeMessageConnector from '../../../../connectors/components/CryptoExchangeMessageConnector'
import CryptoExchangeQuoteTimerConnector from '../../../../connectors/components/CryptoExchangeQuoteTimerConnector'
import * as Constants from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import { CryptoExchangeSceneStyle } from '../../../../styles/indexStyles'
import type { GuiCurrencyInfo, GuiWallet } from '../../../../types'
import { emptyCurrencyInfo } from '../../../../types'
import Gradient from '../../../UI/components/Gradient/Gradient.ui'
import WalletListModal from '../../../UI/components/WalletListModal/WalletListModalConnector'
import { getDenomFromIsoCode } from '../../../utils.js'
import { IconButton } from '../../components/Buttons/IconButton.ui'
import { PrimaryButton } from '../../components/Buttons/index'
import { CryptoExchangeFlipInputWrapperComponent } from '../../components/FlipInput/CryptoExchangeFlipInputWrapperComponent.js'
import type { ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2'
import SafeAreaView from '../../components/SafeAreaView'

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
  showWalletSelectModal: boolean,

  // Exchange rate between crypto to crypto
  exchangeRate: number,

  // The following props are used to populate the confirmation modal
  fromCurrencyCode: string,
  fromCurrencyIcon: string,
  fromCurrencyIconDark: string,
  fromDisplayAmount: string,
  toCurrencyIcon: string,
  toCurrencyIconDark: string,
  toCurrencyCode: string,
  toDisplayAmount: string,
  fee: string,

  // Number of times To and From wallets were flipped
  forceUpdateGuiCounter: number,
  showWalletSelectModal: boolean,
  showConfirmShiftModal: boolean,
  shiftPendingTransaction: boolean
}

export type CryptoExchangeSceneComponentDispatchProps = {
  onSelectWallet(string, string): void,
  getShapeShiftTokens(): void,
  openModal: (data: string) => any,
  getQuoteForTransaction(SetNativeAmountInfo): void
}

type Props = CryptoExchangeSceneComponentStateProps & CryptoExchangeSceneComponentDispatchProps

type State = {
  whichWallet: string, // Which wallet selector dropdown was tapped
  whichWalletFocus: string, // Which wallet FlipInput was last focused and edited
  fromExchangeAmount: string,
  forceUpdateGuiCounter: number,
  toExchangeAmount: string
}

export class CryptoExchangeSceneComponent extends Component<Props, State> {
  fromAmountNative: string
  fromAmountDisplay: string
  toAmountNative: string
  toAmountDisplay: string
  constructor (props: Props) {
    super(props)
    const newState: State = {
      whichWallet: Constants.FROM,
      whichWalletFocus: Constants.FROM,
      forceUpdateGuiCounter: 0,
      fromExchangeAmount: '',
      toExchangeAmount: ''
    }
    this.state = newState
    slowlog(this, /.*/, global.slowlogOptions)
    this.props.getShapeShiftTokens()
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (this.state.forceUpdateGuiCounter !== nextProps.forceUpdateGuiCounter) {
      this.setState({
        fromExchangeAmount: nextProps.fromExchangeAmount,
        toExchangeAmount: nextProps.toExchangeAmount,
        forceUpdateGuiCounter: nextProps.forceUpdateGuiCounter
      })
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
    const style = CryptoExchangeSceneStyle
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
      <SafeAreaView>
        <Gradient style={style.scene}>
          <Gradient style={style.gradient} />
          <KeyboardAwareScrollView
            style={[style.mainScrollView]}
            keyboardShouldPersistTaps={Constants.ALWAYS}
            contentContainerStyle={style.scrollViewContentContainer}
          >
            <CryptoExchangeMessageConnector style={style.exchangeRateBanner} />
            <View style={style.shim} />
            <CryptoExchangeFlipInputWrapperComponent
              style={style.flipWrapper}
              guiWallet={this.props.fromWallet}
              fee={this.props.fee}
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
            <View style={style.shim} />
            <IconButton style={style.flipButton} icon={Constants.SWAP_VERT} onPress={this.flipThis} />
            <View style={style.shim} />
            <CryptoExchangeFlipInputWrapperComponent
              style={style.flipWrapper}
              guiWallet={this.props.toWallet}
              fee={null}
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
              focusMe={this.focusToWallet}
            />
            <View style={style.shim} />
            <View style={style.actionButtonContainer}>{this.renderButton()}</View>
            <View style={style.shim} />
            <CryptoExchangeQuoteTimerConnector style={style.timerContainer} />
          </KeyboardAwareScrollView>
          {this.renderDropUp()}
        </Gradient>
      </SafeAreaView>
    )
  }
  getQuote = () => {
    const data: SetNativeAmountInfo = {
      whichWallet: this.state.whichWalletFocus,
      primaryExchangeAmount: this.state.whichWalletFocus === Constants.FROM ? this.fromAmountDisplay : this.toAmountDisplay,
      primaryNativeAmount: this.state.whichWalletFocus === Constants.FROM ? this.fromAmountNative : this.toAmountNative
    }
    if (data.primaryNativeAmount && data.primaryNativeAmount !== '0') {
      this.props.getQuoteForTransaction(data)
    }
    // this.props.getQuoteForTransaction(data)
  }
  renderButton = () => {
    if (this.props.fromCurrencyCode !== '' && this.props.toCurrencyCode !== '') {
      return (
        <PrimaryButton onPress={this.getQuote}>
          <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
        </PrimaryButton>
      )
    }
    return null
  }
  flipThis = () => {
    // this.props.swapFromAndToWallets()
  }

  launchFromWalletSelector = () => {
    this.props.openModal(Constants.FROM)
    this.setState({
      whichWallet: Constants.FROM
    })
  }

  launchToWalletSelector = () => {
    this.props.openModal(Constants.TO)
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
    this.fromAmountNative = amounts.nativeAmount
    this.fromAmountDisplay = amounts.exchangeAmount
  }

  renderDropUp = () => {
    const { onSelectWallet, fromCurrencyCode, fromWallet, toCurrencyCode, toWallet } = this.props
    const { whichWallet } = this.state
    let excludedCurrencyCode = ''
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
    if (this.props.showWalletSelectModal) {
      return (
        <WalletListModal
          onSelectWallet={onSelectWallet}
          topDisplacement={Constants.CRYPTO_EXCHANGE_WALLET_DIALOG_TOP}
          type={Constants.CRYPTO_EXCHANGE}
          whichWallet={whichWallet}
          excludedCurrencyCode={excludedCurrencyCode}
        />
      )
    }
    return null
  }
}
