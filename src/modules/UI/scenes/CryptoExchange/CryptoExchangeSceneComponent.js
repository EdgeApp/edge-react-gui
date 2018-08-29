// @flow

import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import slowlog from 'react-native-slowlog'

import type { SetNativeAmountInfo } from '../../../../actions/CryptoExchangeActions.js'
import CryptoExchangeQuoteTimerConnector from '../../../../connectors/components/CryptoExchangeQuoteTimerConnector'
import CryptoExchangeConnector from '../../../../connectors/components/CryptoExchangeRateConnector'
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
import CryptoExchangeConfirmTransactionModalComponent from './CryptoExchangeConfirmTransactionModalComponent'

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

  showNextButton: boolean,
  showWalletSelectModal: boolean,
  showConfirmShiftModal: boolean,
  gettingTransaction: boolean,
  shiftPendingTransaction: boolean
}

export type CryptoExchangeSceneComponentDispatchProps = {
  swapFromAndToWallets: () => any,

  // Opens the wallet selector
  openModal: (data: string) => any,
  shift: () => any,
  closeConfirmation: () => any,
  openConfirmation: () => any,
  getShapeShiftTokens: () => any,
  setNativeAmount: (data: SetNativeAmountInfo) => any,
  onSelectWallet: (string, string) => any
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
  UNSAFE_componentWillMount () {
    this.props.getShapeShiftTokens()
  }

  componentDidMount () {
    // const overridePrimaryExchangeAmount = bns.div(this.props.nativeAmount, this.props.primaryCurrencyInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
    // this.setState({overridePrimaryExchangeAmount})
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

    console.log(this.props.shiftPendingTransaction)
    return (
      <SafeAreaView>
        <Gradient style={style.scene}>
          <Gradient style={style.gradient} />
          <KeyboardAwareScrollView
            style={[style.mainScrollView]}
            keyboardShouldPersistTaps={Constants.ALWAYS}
            contentContainerStyle={style.scrollViewContentContainer}
          >
            <CryptoExchangeConnector style={style.exchangeRateBanner} />
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
            />
            <View style={style.shim} />
            <View style={style.actionButtonContainer}>{this.renderButton()}</View>
            <View style={style.shim} />
            <CryptoExchangeQuoteTimerConnector style={style.timerContainer} />
          </KeyboardAwareScrollView>
          {this.renderDropUp()}
          {this.renderConfirmation(style.confirmModal)}
        </Gradient>
      </SafeAreaView>
    )
  }

  renderButton = () => {
    const { showNextButton, gettingTransaction } = this.props
    if (showNextButton) {
      return (
        <PrimaryButton onPress={this.props.openConfirmation} disabled={gettingTransaction}>
          {gettingTransaction ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
        </PrimaryButton>
      )
    }
    return null
  }
  flipThis = () => {
    this.props.swapFromAndToWallets()
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

  fromAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    const data: SetNativeAmountInfo = {
      whichWallet: Constants.FROM,
      primaryExchangeAmount: amounts.exchangeAmount,
      primaryNativeAmount: amounts.nativeAmount
    }
    this.setState({ whichWalletFocus: Constants.FROM })
    this.props.setNativeAmount(data)
  }

  toAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    const data: SetNativeAmountInfo = {
      whichWallet: Constants.TO,
      primaryExchangeAmount: amounts.exchangeAmount,
      primaryNativeAmount: amounts.nativeAmount
    }
    this.setState({ whichWalletFocus: Constants.TO })
    this.props.setNativeAmount(data)
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

  renderConfirmation = (style: Object) => {
    if (this.props.showConfirmShiftModal) {
      return (
        <CryptoExchangeConfirmTransactionModalComponent
          style={style}
          fromWallet={this.props.fromWallet}
          toWallet={this.props.toWallet}
          closeFunction={this.props.closeConfirmation}
          fromCurrencyIconDark={this.props.fromCurrencyIconDark}
          fromCurrencyAmount={this.props.fromDisplayAmount}
          fromCurrencyCode={this.props.fromCurrencyCode}
          toCurrencyIconDark={this.props.toCurrencyIconDark}
          toCurrencyAmount={this.props.toDisplayAmount}
          toCurrencyCode={this.props.toCurrencyCode}
          fee={this.props.fee}
          confirmFunction={this.props.shift}
          pending={this.props.shiftPendingTransaction}
        />
      )
    }
    return null
  }
}
