// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { ActivityIndicator, Keyboard, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { type SetNativeAmountInfo, exchangeMax, getQuoteForTransaction, selectWalletForExchange } from '../../actions/CryptoExchangeActions'
import { updateMostRecentWalletsSelected } from '../../actions/WalletActions.js'
import { getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getExchangeRate } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type GuiCurrencyInfo, type GuiWallet, emptyCurrencyInfo, emptyGuiWallet } from '../../types/types.js'
import { DECIMAL_PRECISION, getDenomFromIsoCode, zeroString } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import Alert from '../themed/Alert'
import { CryptoExchangeFlipInputWrapper } from '../themed/CryptoExchangeFlipInputWrapperComponent.js'
import { CryptoExchangeMessageBox } from '../themed/CryptoExchangeMessageBoxComponent'
import type { ExchangedFlipInputAmounts } from '../themed/ExchangedFlipInput'
import { LineTextDivider } from '../themed/LineTextDivider'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'

type StateProps = {
  // The following props are used to populate the CryptoExchangeFlipInputs
  fromWallet: GuiWallet,
  fromExchangeAmount: string,
  fromWalletPrimaryInfo: GuiCurrencyInfo,
  fromButtonText: string,
  fromFiatToCrypto: string,
  toWallet: GuiWallet,
  toExchangeAmount: string,
  toWalletPrimaryInfo: GuiCurrencyInfo,
  toButtonText: string,
  toFiatToCrypto: string,

  // The following props are used to populate the confirmation modal
  fromCurrencyCode: string,
  fromCurrencyIcon: string,
  toCurrencyIcon: string,
  toCurrencyCode: string,

  // Number of times To and From wallets were flipped
  forceUpdateGuiCounter: number,
  calculatingMax: boolean,
  creatingWallet: boolean,

  // Determines if a coin can have Exchange Max option
  hasMaxSpend: boolean
}
type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string, direction: 'from' | 'to') => void,
  getQuoteForTransaction: SetNativeAmountInfo => void,
  exchangeMax: () => void
}
type Props = StateProps & DispatchProps & ThemeProps

type State = {
  whichWalletFocus: 'from' | 'to', // Which wallet FlipInput was last focused and edited
  fromExchangeAmount: string,
  forceUpdateGuiCounter: number,
  toExchangeAmount: string,
  fromAmountNative: string,
  toAmountNative: string
}

const disabledCurrencyCodes = Object.keys(SPECIAL_CURRENCY_INFO).filter(code => !!SPECIAL_CURRENCY_INFO[code].keysOnlyMode)

const defaultFromWalletInfo = {
  fromCurrencyCode: '',
  fromWalletPrimaryInfo: emptyCurrencyInfo,
  fromButtonText: s.strings.select_src_wallet,
  fromExchangeAmount: '',
  fromFiatToCrypto: '1',
  fromWallet: emptyGuiWallet,
  hasMaxSpend: false
}

const defaultToWalletInfo = {
  toCurrencyCode: '',
  toWalletPrimaryInfo: emptyCurrencyInfo,
  toButtonText: s.strings.select_recv_wallet,
  toExchangeAmount: '',
  toWallet: emptyGuiWallet,
  toFiatToCrypto: '1'
}

class CryptoExchangeComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const newState: State = {
      whichWalletFocus: 'from',
      forceUpdateGuiCounter: 0,
      fromExchangeAmount: '',
      toExchangeAmount: '',
      fromAmountNative: '',
      toAmountNative: ''
    }
    this.state = newState
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (props.forceUpdateGuiCounter !== state.forceUpdateGuiCounter) {
      return {
        fromAmountNative: bns.mul(props.fromExchangeAmount, props.fromWalletPrimaryInfo.exchangeDenomination.multiplier),
        fromExchangeAmount: props.fromExchangeAmount,
        toExchangeAmount: props.toExchangeAmount,
        forceUpdateGuiCounter: props.forceUpdateGuiCounter
      }
    } else {
      // Check which wallet we are currently editing.
      // Only change the exchangeAmount of the opposite wallet to prevent feedback loops
      if (state.whichWalletFocus === 'from') {
        return { toExchangeAmount: props.toExchangeAmount }
      } else {
        return { fromExchangeAmount: props.fromExchangeAmount }
      }
    }
  }

  getQuote = () => {
    const data: SetNativeAmountInfo = {
      whichWallet: this.state.whichWalletFocus,
      primaryNativeAmount: this.state.whichWalletFocus === 'from' ? this.state.fromAmountNative : this.state.toAmountNative
    }
    if (!zeroString(data.primaryNativeAmount)) {
      this.props.getQuoteForTransaction(data)
      Keyboard.dismiss()
      return
    }
    showError(`${s.strings.no_exchange_amount}. ${s.strings.select_exchange_amount}.`)
  }

  launchFromWalletSelector = () => {
    this.renderDropUp('from')
  }

  launchToWalletSelector = () => {
    this.renderDropUp('to')
  }

  focusFromWallet = () => {
    this.setState({
      whichWalletFocus: 'from'
    })
  }

  focusToWallet = () => {
    this.setState({
      whichWalletFocus: 'to'
    })
  }

  fromAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.setState({
      fromAmountNative: amounts.nativeAmount
    })
  }

  toAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.setState({
      toAmountNative: amounts.nativeAmount
    })
  }

  renderButton = () => {
    const primaryNativeAmount = this.state.whichWalletFocus === 'from' ? this.state.fromAmountNative : this.state.toAmountNative
    const showNext = this.props.fromCurrencyCode !== '' && this.props.toCurrencyCode !== '' && !this.props.calculatingMax && !!parseFloat(primaryNativeAmount)
    if (!showNext) return null
    return <MainButton label={s.strings.string_done_cap} type="secondary" marginRem={[1.5, 0, 0]} paddingRem={[0.5, 2.3]} onPress={this.getQuote} />
  }

  renderAlert = () => {
    const {
      fromWallet: { primaryNativeBalance },
      fromCurrencyCode
    } = this.props

    const { minimumPopupModals } = getSpecialCurrencyInfo(fromCurrencyCode)

    if (minimumPopupModals && primaryNativeBalance < minimumPopupModals.minimumNativeBalance) {
      return <Alert marginRem={[1.5, 1]} title={s.strings.request_minimum_notification_title} message={minimumPopupModals.alertMessage} type="warning" />
    }
    return null
  }

  renderDropUp = (whichWallet: 'from' | 'to') => {
    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        label={s.strings.wallet_list_wallet_search}
        headerTitle={whichWallet === 'to' ? s.strings.select_recv_wallet : s.strings.select_src_wallet}
        showCreateWallet={whichWallet === 'to'}
        excludeCurrencyCodes={whichWallet === 'to' ? disabledCurrencyCodes : []}
      />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        this.props.onSelectWallet(walletId, currencyCode, whichWallet)
      }
    })
    return null
  }

  render() {
    const styles = getStyles(this.props.theme)
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
      <SceneWrapper background="theme">
        <SceneHeader withTopMargin title={s.strings.title_exchange} underline />
        <KeyboardAwareScrollView style={styles.mainScrollView} keyboardShouldPersistTaps="always" contentContainerStyle={styles.scrollViewContentContainer}>
          <CryptoExchangeMessageBox />
          <LineTextDivider title={s.strings.fragment_send_from_label} lowerCased />
          <CryptoExchangeFlipInputWrapper
            guiWallet={this.props.fromWallet}
            buttonText={this.props.fromButtonText}
            currencyLogo={this.props.fromCurrencyIcon}
            headerText={fromHeaderText}
            primaryCurrencyInfo={this.props.fromWalletPrimaryInfo}
            secondaryCurrencyInfo={fromSecondaryInfo}
            fiatPerCrypto={this.props.fromFiatToCrypto}
            overridePrimaryExchangeAmount={this.state.fromExchangeAmount}
            forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
            launchWalletSelector={this.launchFromWalletSelector}
            onCryptoExchangeAmountChanged={this.fromAmountChanged}
            isFocused={isFromFocused}
            focusMe={this.focusFromWallet}
            onNext={this.getQuote}
          >
            {this.props.hasMaxSpend && (
              <View style={styles.exchangeMaxButton}>
                <MainButton onPress={this.props.exchangeMax} marginRem={[1.2, 0, 0]} label={s.strings.exchange_max_amount} type="secondary" />
              </View>
            )}
          </CryptoExchangeFlipInputWrapper>
          <LineTextDivider title={s.strings.string_to_capitalize} lowerCased />
          <CryptoExchangeFlipInputWrapper
            guiWallet={this.props.toWallet}
            buttonText={this.props.toButtonText}
            currencyLogo={this.props.toCurrencyIcon}
            headerText={toHeaderText}
            primaryCurrencyInfo={this.props.toWalletPrimaryInfo}
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
          {this.props.calculatingMax && <ActivityIndicator style={styles.spinner} color={this.props.theme.iconTappable} />}
          {this.renderButton()}
          {this.renderAlert()}
          <View style={styles.spacer} />
        </KeyboardAwareScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  mainScrollView: {
    flex: 1
  },
  scrollViewContentContainer: {
    alignItems: 'center'
  },
  spinner: {
    marginVertical: theme.rem(1.5)
  },
  spacer: {
    height: theme.rem(15)
  },
  exchangeMaxButton: {
    alignSelf: 'center'
  }
}))

export const CryptoExchangeScene = connect<StateProps, DispatchProps, {}>(
  state => {
    const { cryptoExchange } = state
    // Clone the default Info
    const result = {
      ...defaultFromWalletInfo,
      ...defaultToWalletInfo
    }
    const { fromWallet, toWallet } = cryptoExchange
    // Get the values of the 'From' Wallet
    if (fromWallet) {
      const { fromNativeAmount, fromWalletPrimaryInfo } = cryptoExchange
      const {
        displayDenomination: { name: fromCurrencyCode },
        exchangeDenomination: { multiplier },
        exchangeCurrencyCode
      } = fromWalletPrimaryInfo
      const { name: fromWalletName, isoFiatCurrencyCode, currencyCode } = fromWallet

      Object.assign(result, {
        fromWallet,
        fromCurrencyCode,
        fromWalletPrimaryInfo,
        fromButtonText: fromWalletName + ':' + fromCurrencyCode,
        fromExchangeAmount: bns.div(fromNativeAmount, multiplier, DECIMAL_PRECISION),
        fromFiatToCrypto: getExchangeRate(state, exchangeCurrencyCode, isoFiatCurrencyCode),
        hasMaxSpend: currencyCode != null && getSpecialCurrencyInfo(currencyCode).noMaxSpend !== true
      })
    }

    // Get the values of the 'To' Wallet
    if (toWallet) {
      const { toNativeAmount, toWalletPrimaryInfo } = cryptoExchange
      const {
        displayDenomination: { name: toCurrencyCode },
        exchangeDenomination: { multiplier },
        exchangeCurrencyCode
      } = toWalletPrimaryInfo
      const { name: toWalletName, isoFiatCurrencyCode } = toWallet

      Object.assign(result, {
        toWallet,
        toCurrencyCode,
        toWalletPrimaryInfo,
        toButtonText: toWalletName + ':' + toCurrencyCode,
        toExchangeAmount: bns.div(toNativeAmount, multiplier, DECIMAL_PRECISION),
        toFiatToCrypto: getExchangeRate(state, exchangeCurrencyCode, isoFiatCurrencyCode)
      })
    }

    return {
      ...result,
      fromCurrencyIcon: cryptoExchange.fromCurrencyIcon ?? '',
      toCurrencyIcon: cryptoExchange.toCurrencyIcon ?? '',
      forceUpdateGuiCounter: cryptoExchange.forceUpdateGuiCounter,
      calculatingMax: cryptoExchange.calculatingMax,
      creatingWallet: cryptoExchange.creatingWallet
    }
  },
  dispatch => ({
    getQuoteForTransaction(fromWalletNativeAmount) {
      dispatch(getQuoteForTransaction(fromWalletNativeAmount))
    },
    onSelectWallet(walletId, currencyCode, direction) {
      dispatch(selectWalletForExchange(walletId, currencyCode, direction))
      dispatch(updateMostRecentWalletsSelected(walletId, currencyCode))
    },
    exchangeMax() {
      dispatch(exchangeMax())
    }
  })
)(withTheme(CryptoExchangeComponent))
