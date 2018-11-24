// @flow
import { bns } from 'biggystring'
import { showModal } from 'edge-components'
import React, { Component } from 'react'
import { Alert, Keyboard, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import slowlog from 'react-native-slowlog'

import type { SetNativeAmountInfo } from '../../actions/CryptoExchangeActions.js'
import CryptoExchangeMessageConnector from '../../connectors/components/CryptoExchangeMessageConnector'
// /Volumes/work/SourceCode/AirbitzFresh/edge-react-gui/src/modules/UI/scenes/Settings/components/RestoreWalletsModal.ui
import { SwapKYCModalConnector } from '../../connectors/components/SwapKYCModalConnector.js'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import { CryptoExchangeFlipInputWrapperComponent } from '../../modules/UI/components/FlipInput/CryptoExchangeFlipInputWrapperComponent.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import WalletListModal from '../../modules/UI/components/WalletListModal/WalletListModalConnector'
import { CryptoExchangeSceneStyle } from '../../styles/indexStyles'
import { emptyCurrencyInfo } from '../../types'
import type { GuiCurrencyInfo, GuiWallet } from '../../types'
import { getDenomFromIsoCode } from '../../util/utils.js'

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
  showWalletSelectModal: boolean,
  shiftPendingTransaction: boolean,
  showKYCAlert: boolean
}

export type CryptoExchangeSceneComponentDispatchProps = {
  onSelectWallet(string, string): void,
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

export class CryptoExchangeScene extends Component<Props, State> {
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
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    if (!this.props.showKYCAlert && nextProps.showKYCAlert) {
      Alert.alert(s.strings.kyc_title, s.strings.kyc_message, [{ text: s.strings.string_cancel_cap }, { text: s.strings.string_ok, onPress: this.getKYCToken }])
    }
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
            <Icon style={style.downArrow} name={Constants.ARROW_DOWN_BOLD} size={style.downArrowSize} type={Constants.MATERIAL_COMMUNITY} />
            <View style={style.shim} />
            <CryptoExchangeFlipInputWrapperComponent
              style={style.flipWrapper}
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
              focusMe={this.focusToWallet}
            />
            <View style={style.shim} />
            <View style={style.actionButtonContainer}>{this.renderButton()}</View>
            <View style={style.shim} />
          </KeyboardAwareScrollView>
          {this.renderDropUp()}
        </Gradient>
      </SafeAreaView>
    )
  }
  getKYCToken = () => {
    showModal(SwapKYCModalConnector, { style: { margin: 0 } }).then((response: null | { accessToken: string, refreshToken: string }) => {
      console.log('nav: ', response)
    })
  }
  getQuote = () => {
    const data: SetNativeAmountInfo = {
      whichWallet: this.state.whichWalletFocus,
      primaryExchangeAmount: this.state.whichWalletFocus === Constants.FROM ? this.fromAmountDisplay : this.toAmountDisplay,
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
    if (this.props.fromCurrencyCode !== '' && this.props.toCurrencyCode !== '') {
      return (
        <PrimaryButton onPress={this.getQuote}>
          <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
        </PrimaryButton>
      )
    }
    return null
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
    this.toAmountNative = amounts.nativeAmount
    this.toAmountDisplay = amounts.exchangeAmount
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
