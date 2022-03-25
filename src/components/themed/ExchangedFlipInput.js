// @flow

import { div, log10, mul } from 'biggystring'
import * as React from 'react'

import type { GuiCurrencyInfo } from '../../types/types.js'
import { DECIMAL_PRECISION, getObjectDiff, precisionAdjust, zeroString } from '../../util/utils.js'
import type { FlipInputFieldInfo } from './FlipInput.js'
import { FlipInput } from './FlipInput.js'

export type ExchangedFlipInputAmounts = {
  exchangeAmount: string,
  nativeAmount: string
}

export type ExchangedFlipInputOwnProps = {
  // Initial amount of the primary field in `exchangeAmount` denomination. This is converted to a `decimalAmount`
  // in the proper display denomination to be passed into FlipInput
  overridePrimaryExchangeAmount: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  onNext?: () => void,
  onFocus?: () => void,
  onBlur?: () => void,

  // Exchange rate
  exchangeSecondaryToPrimaryRatio: string,

  forceUpdateGuiCounter: number,
  keyboardVisible: boolean,

  // Callback for when the `primaryAmount` changes. This returns both a `nativeAmount` and an `exchangeAmount`. Both
  // amounts are ONLY for the primary field. Parent will not be given values for the secondary field.
  onExchangeAmountChanged(amounts: ExchangedFlipInputAmounts): mixed,
  isEditable: boolean,
  isFiatOnTop: boolean,
  isFocus: boolean,

  topReturnKeyType?: string,
  inputAccessoryViewID?: string,
  headerText: string,
  headerLogo: string | void,
  headerCallback?: () => void,
  onError?: (error: string | void) => void
}

type Props = ExchangedFlipInputOwnProps

type State = {
  overridePrimaryDecimalAmount: string, // This should be a decimal amount in display denomination (ie. mBTC)
  exchangeSecondaryToPrimaryRatio: string,
  primaryInfo: FlipInputFieldInfo,
  secondaryInfo: FlipInputFieldInfo
}

function getPrimaryDisplayToExchangeRatio(props: Props): string {
  const exchangeMultiplier: string = props.primaryCurrencyInfo.exchangeDenomination.multiplier
  const displayMultiplier: string = props.primaryCurrencyInfo.displayDenomination.multiplier
  return div(exchangeMultiplier, displayMultiplier, DECIMAL_PRECISION)
}

function getSecondaryDisplayToExchangeRatio(props: Props): string {
  const displayMultiplier: string = props.secondaryCurrencyInfo.displayDenomination.multiplier
  const exchangeMultiplier: string = props.secondaryCurrencyInfo.exchangeDenomination.multiplier
  return div(exchangeMultiplier, displayMultiplier, DECIMAL_PRECISION)
}

function propsToState(props: Props): State {
  // Calculate secondaryToPrimaryRatio for FlipInput. FlipInput takes a ratio in display amounts which may be
  // different than exchange amounts. ie. USD / mBTC
  // nextProps.exchangeSecondaryToPrimaryRatio // ie. 1/10000
  const primaryDisplayToExchangeRatio = getPrimaryDisplayToExchangeRatio(props) // 1/1000 for mBTC
  const secondaryDisplayToExchangeRatio = getSecondaryDisplayToExchangeRatio(props) // 1 for USD
  let exchangeSecondaryToPrimaryRatio = div(props.exchangeSecondaryToPrimaryRatio, primaryDisplayToExchangeRatio, DECIMAL_PRECISION) // Should be 1/10

  exchangeSecondaryToPrimaryRatio = mul(exchangeSecondaryToPrimaryRatio, secondaryDisplayToExchangeRatio) // Noop usually for USD since we only ever use the same exchange and display multiplier

  // Calculate FlipInputFieldInfo from GuiCurrencyInfos
  const secondaryPrecision: number = log10(props.secondaryCurrencyInfo.displayDenomination.multiplier)
  const primaryEntryPrecision = log10(props.primaryCurrencyInfo.displayDenomination.multiplier)
  // Limit the precision of the primaryPrecision by what would be no more
  // than 0.01 (of whateve fiat currency) accuracy when converting a fiat value into a crypto value.
  //
  // Assume secondaryInfo refers to a fiatValue and take the secondaryToPrimaryRatio (exchange rate) and
  // see how much precision this crypto denomination needs to achieve accuracy to 0.01 units of the current fiat
  // currency. To do this we need to compare the "exchangeDenomination" of primaryInfo and secondaryInfo since
  // only those values are relevant to secondaryToPrimaryRatio
  const precisionAdjustVal = precisionAdjust({
    primaryExchangeMultiplier: props.primaryCurrencyInfo.exchangeDenomination.multiplier,
    secondaryExchangeMultiplier: props.secondaryCurrencyInfo.exchangeDenomination.multiplier,
    exchangeSecondaryToPrimaryRatio: props.exchangeSecondaryToPrimaryRatio
  })

  const newPrimaryPrecision = primaryEntryPrecision - precisionAdjustVal
  const primaryConversionPrecision = newPrimaryPrecision >= 0 ? newPrimaryPrecision : 0

  const primaryInfo: FlipInputFieldInfo = {
    currencyName: props.primaryCurrencyInfo.displayDenomination.name,
    currencySymbol: props.primaryCurrencyInfo.displayDenomination.symbol ? props.primaryCurrencyInfo.displayDenomination.symbol : '',
    currencyCode: props.primaryCurrencyInfo.displayCurrencyCode,
    maxEntryDecimals: primaryEntryPrecision,
    maxConversionDecimals: primaryConversionPrecision
  }

  const secondaryInfo: FlipInputFieldInfo = {
    currencyName: props.secondaryCurrencyInfo.displayDenomination.name,
    currencySymbol: props.secondaryCurrencyInfo.displayDenomination.symbol ? props.secondaryCurrencyInfo.displayDenomination.symbol : '',
    currencyCode: props.secondaryCurrencyInfo.displayCurrencyCode,
    maxEntryDecimals: secondaryPrecision,
    maxConversionDecimals: secondaryPrecision
  }

  // Convert overridePrimaryExchangeAmount => overridePrimaryDecimalAmount which goes from exchange to display
  // ie BTC to mBTC
  const overridePrimaryDecimalAmount = mul(props.overridePrimaryExchangeAmount, primaryDisplayToExchangeRatio)

  return { primaryInfo, secondaryInfo, exchangeSecondaryToPrimaryRatio, overridePrimaryDecimalAmount }
}

export class ExchangedFlipInput extends React.Component<Props, State> {
  flipInput: React.ElementRef<typeof FlipInput> | null = null

  static defaultProps = {
    isEditable: true
  }

  constructor(props: Props) {
    super(props)
    this.state = propsToState(props)
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    this.setState(propsToState(nextProps))
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    let diffElement2: string = ''
    const diffElement = getObjectDiff(this.props, nextProps, {
      primaryCurrencyInfo: true,
      secondaryCurrencyInfo: true
    })
    if (!diffElement) {
      diffElement2 = getObjectDiff(this.state, nextState, {
        primaryInfo: true,
        secondaryInfo: true
      })
    }
    return !!diffElement || !!diffElement2
  }

  onAmountChanged = (decimalAmount: string): void => {
    const exchangeAmount = div(decimalAmount, getPrimaryDisplayToExchangeRatio(this.props), DECIMAL_PRECISION)
    const nativeAmount = mul(exchangeAmount, this.props.primaryCurrencyInfo.exchangeDenomination.multiplier)
    this.props.onExchangeAmountChanged({ exchangeAmount, nativeAmount })
  }

  isFiatOnTop = () => {
    if (!this.props.isFiatOnTop) {
      return false
    }
    return !zeroString(this.state.exchangeSecondaryToPrimaryRatio)
  }

  toggleCryptoOnBottom = () => {
    if (this.flipInput != null) {
      this.flipInput.toggleCryptoOnBottom()
    }
  }

  render() {
    return (
      <FlipInput
        overridePrimaryDecimalAmount={this.state.overridePrimaryDecimalAmount}
        exchangeSecondaryToPrimaryRatio={this.state.exchangeSecondaryToPrimaryRatio}
        headerText={this.props.headerText}
        headerLogo={this.props.headerLogo}
        headerCallback={this.props.headerCallback}
        primaryInfo={this.state.primaryInfo}
        secondaryInfo={this.state.secondaryInfo}
        forceUpdateGuiCounter={this.props.forceUpdateGuiCounter}
        onAmountChanged={this.onAmountChanged}
        onError={this.props.onError}
        keyboardVisible={this.props.keyboardVisible}
        isEditable={this.props.isEditable}
        isFiatOnTop={this.isFiatOnTop()}
        isFocus={this.props.isFocus}
        onNext={this.props.onNext}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}
        topReturnKeyType={this.props.topReturnKeyType}
        inputAccessoryViewID={this.props.inputAccessoryViewID}
        ref={ref => (this.flipInput = ref)}
      />
    )
  }
}
