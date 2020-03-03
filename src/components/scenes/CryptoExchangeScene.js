// @flow

import { bns } from 'biggystring'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Keyboard, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import type { SetNativeAmountInfo } from '../../actions/CryptoExchangeActions.js'
import CryptoExchangeMessageConnector from '../../connectors/components/CryptoExchangeMessageConnector'
import { WalletListModalConnected as WalletListModal } from '../../connectors/components/WalletListModalConnector.js'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import { CryptoExchangeFlipInputWrapperComponent } from '../../modules/UI/components/FlipInput/CryptoExchangeFlipInputWrapperComponent.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import { styles } from '../../styles/scenes/CryptoExchangeSceneStyles.js'
import { type GuiCurrencyInfo, type GuiWallet, emptyCurrencyInfo } from '../../types/types.js'
import { getDenomFromIsoCode } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { Airship } from '../services/AirshipInstance.js'

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
          <Icon style={styles.downArrow} name={Constants.ARROW_DOWN_BOLD} size={styles.downArrowSize} type={Constants.MATERIAL_COMMUNITY} />
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
    const walletCurrencyCodes = []
    const allowedWallets = []
    for (const id in wallets) {
      const wallet = wallets[id]
      walletCurrencyCodes.push(wallet.currencyCode)
      if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
        allowedWallets.push(wallets[id])
      }
    }
    const supportedWalletTypes = []
    for (let i = 0; i < this.props.supportedWalletTypes.length; i++) {
      const swt = this.props.supportedWalletTypes[i]
      if (!walletCurrencyCodes.includes(swt.currencyCode) && swt.currencyCode !== 'EOS') {
        supportedWalletTypes.push(swt)
      }
    }
    const filterWalletId = whichWallet === Constants.TO ? fromWallet.id : toWallet.id
    const filterWalletCurrencyCode = whichWallet === Constants.TO ? fromCurrencyCode : toCurrencyCode
    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        wallets={allowedWallets}
        type={whichWallet}
        existingWalletToFilterId={filterWalletId}
        existingWalletToFilterCurrencyCode={filterWalletCurrencyCode}
        supportedWalletTypes={supportedWalletTypes}
        excludedCurrencyCode={[]}
        showWalletCreators={whichWallet === Constants.TO}
        headerTitle={whichWallet === Constants.TO ? s.strings.select_recv_wallet : s.strings.select_src_wallet}
        excludedTokens={[]}
        noWalletCodes={[]}
        disableZeroBalance={false}
      />
    )).then((response: GuiWallet | Object | null) => {
      if (response) {
        if (response.id) {
          onSelectWallet(response.id, response.currencyCode)
          return
        }
        if (typeof response.value === 'string') {
          this.props.createCurrencyWallet(response.value, response.currencyCode, this.props.defaultIsoFiat)
        }
      }
    })
    return null
  }
}
