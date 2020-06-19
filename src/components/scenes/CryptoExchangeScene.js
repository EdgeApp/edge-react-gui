// @flow

import { bns } from 'biggystring'
import { type EdgeAccount } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Keyboard, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import slowlog from 'react-native-slowlog'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { type SetNativeAmountInfo, getQuoteForTransaction, selectWalletForExchange } from '../../actions/CryptoExchangeActions.js'
import { updateMostRecentWalletsSelected } from '../../actions/WalletActions.js'
import { type WalletListResult, WalletListModal } from '../../components/modals/WalletListModal.js'
import CryptoExchangeMessageConnector from '../../connectors/components/CryptoExchangeMessageConnector'
import { ARROW_DOWN_BOLD, MATERIAL_COMMUNITY } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { getSettings } from '../../modules/Settings/selectors.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { CryptoExchangeFlipInputWrapperComponent } from '../../modules/UI/components/FlipInput/CryptoExchangeFlipInputWrapperComponent.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import { getExchangeRate } from '../../modules/UI/selectors.js'
import { styles } from '../../styles/scenes/CryptoExchangeSceneStyles.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type GuiCurrencyInfo, type GuiWallet, emptyCurrencyInfo, emptyGuiWallet } from '../../types/types.js'
import { getDenomFromIsoCode } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { Airship } from '../services/AirshipInstance.js'

type StateProps = {
  account: EdgeAccount,

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
  calculatingMax: boolean,
  creatingWallet: boolean,
  defaultIsoFiat: string
}
type DispatchProps = {
  onSelectWallet(string, string): void,
  openModal(data: 'from' | 'to'): mixed,
  getQuoteForTransaction(SetNativeAmountInfo): void
}
type Props = StateProps & DispatchProps

type State = {
  whichWallet: 'from' | 'to', // Which wallet selector dropdown was tapped
  whichWalletFocus: 'from' | 'to', // Which wallet FlipInput was last focused and edited
  fromExchangeAmount: string,
  forceUpdateGuiCounter: number,
  toExchangeAmount: string
}

class CryptoExchangeComponent extends Component<Props, State> {
  fromAmountNative: string
  fromAmountDisplay: string
  toAmountNative: string
  toAmountDisplay: string
  constructor(props: Props) {
    super(props)
    const newState: State = {
      whichWallet: 'from',
      whichWalletFocus: 'from',
      forceUpdateGuiCounter: 0,
      fromExchangeAmount: '',
      toExchangeAmount: ''
    }
    this.state = newState
    slowlog(this, /.*/, global.slowlogOptions)
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
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
      if (this.state.whichWalletFocus === 'from') {
        this.setState({ toExchangeAmount: nextProps.toExchangeAmount })
      } else {
        this.setState({ fromExchangeAmount: nextProps.fromExchangeAmount })
      }
    }
  }

  render() {
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
    const isFromFocused = this.state.whichWalletFocus === 'from'
    const isToFocused = this.state.whichWalletFocus === 'to'
    const fromHeaderText = sprintf(s.strings.exchange_from_wallet, this.props.fromWallet.name)
    const toHeaderText = sprintf(s.strings.exchange_to_wallet, this.props.toWallet.name)
    return (
      <SceneWrapper>
        <KeyboardAwareScrollView style={styles.mainScrollView} keyboardShouldPersistTaps="always" contentContainerStyle={styles.scrollViewContentContainer}>
          <CryptoExchangeMessageConnector style={styles.exchangeRateBanner} />
          <View style={styles.shim} />
          <CryptoExchangeFlipInputWrapperComponent
            style={styles.flipWrapper}
            guiWallet={this.props.fromWallet}
            buttonText={this.props.fromButtonText}
            currencyLogo={this.props.fromCurrencyIcon}
            headerText={fromHeaderText}
            primaryCurrencyInfo={this.props.fromPrimaryInfo}
            secondaryCurrencyInfo={fromSecondaryInfo}
            fiatPerCrypto={this.props.fromFiatToCrypto}
            overridePrimaryExchangeAmount={this.state.fromExchangeAmount}
            forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
            launchWalletSelector={this.launchFromWalletSelector}
            onCryptoExchangeAmountChanged={this.fromAmountChanged}
            isFocused={isFromFocused}
            focusMe={this.focusFromWallet}
            onNext={this.getQuote}
          />
          <View style={styles.arrowShim} />
          <Icon style={styles.downArrow} name={ARROW_DOWN_BOLD} size={styles.downArrowSize} type={MATERIAL_COMMUNITY} />
          <View style={styles.arrowShim} />
          <CryptoExchangeFlipInputWrapperComponent
            style={styles.flipWrapper}
            guiWallet={this.props.toWallet}
            buttonText={this.props.toButtonText}
            currencyLogo={this.props.toCurrencyIcon}
            headerText={toHeaderText}
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
            onNext={this.getQuote}
          />
          <View style={styles.shim} />
          <View style={styles.actionButtonContainer}>{this.renderButton()}</View>
          <View style={{ height: 300 }} />
        </KeyboardAwareScrollView>
      </SceneWrapper>
    )
  }

  getQuote = () => {
    const data: SetNativeAmountInfo = {
      whichWallet: this.state.whichWalletFocus,
      primaryNativeAmount: this.state.whichWalletFocus === 'from' ? this.fromAmountNative : this.toAmountNative
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
    this.renderDropUp('from')
    this.setState({
      whichWallet: 'from'
    })
  }

  launchToWalletSelector = () => {
    this.props.openModal('to')
    this.renderDropUp('to')
    this.setState({
      whichWallet: 'to'
    })
  }

  focusFromWallet = () => {
    this.setState({
      whichWallet: 'from',
      whichWalletFocus: 'from'
    })
  }

  focusToWallet = () => {
    this.setState({
      whichWallet: 'to',
      whichWalletFocus: 'to'
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
    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={whichWallet === 'to' ? s.strings.select_recv_wallet : s.strings.select_src_wallet}
        showCreateWallet={whichWallet === 'to'}
      />
    )).then((response: WalletListResult) => {
      if (response.walletToSelect) {
        this.props.onSelectWallet(response.walletToSelect.walletId, response.walletToSelect.currencyCode)
      }
    })
    return null
  }
}

const DIVIDE_PRECISION = 18

export const CryptoExchangeScene = connect(
  (state: ReduxState): StateProps => {
    const fromWallet = state.cryptoExchange.fromWallet
    const toWallet = state.cryptoExchange.toWallet
    let fromCurrencyCode,
      fromPrimaryInfo: GuiCurrencyInfo,
      fromButtonText: string,
      fromNativeAmount: string,
      fromExchangeAmount: string,
      fromFiatToCrypto: number
    if (fromWallet) {
      fromCurrencyCode = state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name
      fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
      fromNativeAmount = state.cryptoExchange.fromNativeAmount
      fromButtonText = fromWallet.name + ':' + fromCurrencyCode
      fromExchangeAmount = bns.div(fromNativeAmount, fromPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
      fromFiatToCrypto = getExchangeRate(state, fromPrimaryInfo.exchangeCurrencyCode, fromWallet.isoFiatCurrencyCode)
    } else {
      fromCurrencyCode = ''
      fromExchangeAmount = ''
      fromPrimaryInfo = emptyCurrencyInfo
      fromButtonText = s.strings.select_src_wallet
      fromFiatToCrypto = 1
    }

    let toCurrencyCode, toPrimaryInfo: GuiCurrencyInfo, toButtonText: string, toNativeAmount: string, toExchangeAmount: string, toFiatToCrypto: number
    if (toWallet) {
      toCurrencyCode = state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name
      toPrimaryInfo = state.cryptoExchange.toWalletPrimaryInfo
      toNativeAmount = state.cryptoExchange.toNativeAmount
      toButtonText = toWallet.name + ':' + toCurrencyCode
      toExchangeAmount = bns.div(toNativeAmount, toPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
      toFiatToCrypto = getExchangeRate(state, toPrimaryInfo.exchangeCurrencyCode, toWallet.isoFiatCurrencyCode)
    } else {
      toCurrencyCode = ''
      toExchangeAmount = ''
      toPrimaryInfo = emptyCurrencyInfo
      toButtonText = s.strings.select_recv_wallet
      toFiatToCrypto = 1
    }
    const creatingWallet = state.cryptoExchange.creatingWallet
    const settings = getSettings(state)
    const defaultIsoFiat = settings.defaultIsoFiat
    return {
      account: state.core.account,
      fromWallet: fromWallet || emptyGuiWallet,
      fromExchangeAmount,
      fromCurrencyCode,
      fromPrimaryInfo,
      fromButtonText,
      fromFiatToCrypto,
      toWallet: toWallet || emptyGuiWallet,
      toExchangeAmount,
      toCurrencyCode,
      toPrimaryInfo,
      toButtonText,
      toFiatToCrypto,
      fromDisplayAmount: state.cryptoExchange.fromDisplayAmount,
      toDisplayAmount: state.cryptoExchange.toDisplayAmount,
      fromCurrencyIcon: state.cryptoExchange.fromCurrencyIcon || '',
      fromCurrencyIconDark: state.cryptoExchange.fromCurrencyIconDark || '',
      toCurrencyIcon: state.cryptoExchange.toCurrencyIcon || '',
      toCurrencyIconDark: state.cryptoExchange.toCurrencyIconDark || '',
      forceUpdateGuiCounter: state.cryptoExchange.forceUpdateGuiCounter,
      calculatingMax: state.cryptoExchange.calculatingMax,
      creatingWallet,
      defaultIsoFiat
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    getQuoteForTransaction(fromWalletNativeAmount: SetNativeAmountInfo) {
      dispatch(getQuoteForTransaction(fromWalletNativeAmount))
    },
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWalletForExchange(walletId, currencyCode))
      dispatch(updateMostRecentWalletsSelected(walletId, currencyCode))
    },
    openModal(data: 'from' | 'to') {
      dispatch({ type: 'OPEN_WALLET_SELECTOR_MODAL', data })
    }
  })
)(CryptoExchangeComponent)
