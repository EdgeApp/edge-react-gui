// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeDenomination, EdgeMetadata, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import React, { Component, Fragment } from 'react'
import { TouchableOpacity, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import { UniqueIdentifierModalConnect as UniqueIdentifierModal } from '../../connectors/UniqueIdentifierModalConnector.js'
import { FEE_ALERT_THRESHOLD, FEE_COLOR_THRESHOLD, getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import ExchangeRate from '../../modules/UI/components/ExchangeRate/index.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { ExchangedFlipInput } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import Text from '../../modules/UI/components/FormattedText/index'
import { PinInput } from '../../modules/UI/components/PinInput/PinInput.ui.js'
import Recipient from '../../modules/UI/components/Recipient/index.js'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import { type AuthType, getSpendInfoWithoutState } from '../../modules/UI/scenes/SendConfirmation/selectors'
import { convertCurrencyFromExchangeRates } from '../../modules/UI/selectors.js'
import { type GuiMakeSpendInfo, type SendConfirmationState } from '../../reducers/scenes/SendConfirmationReducer.js'
import { rawStyles, styles } from '../../styles/scenes/SendConfirmationStyle.js'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../../types/types.js'
import { convertNativeToDisplay, convertNativeToExchange, decimalOrZero, getDenomFromIsoCode } from '../../util/utils.js'
import { AddressTextWithBlockExplorerModal } from '../common/AddressTextWithBlockExplorerModal'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance'

const DIVIDE_PRECISION = 18

export type SendConfirmationStateProps = {
  fiatCurrencyCode: string,
  currencyInfo: EdgeCurrencyInfo | null,
  currencyCode: string,
  nativeAmount: string,
  parentNetworkFee: string | null,
  networkFee: string | null,
  pending: boolean,
  keyboardIsVisible: boolean,
  balanceInCrypto: string,
  balanceInFiat: number,
  parentDisplayDenomination: EdgeDenomination,
  parentExchangeDenomination: GuiDenomination,
  primaryDisplayDenomination: EdgeDenomination,
  primaryExchangeDenomination: GuiDenomination,
  secondaryExchangeCurrencyCode: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  sliderDisabled: boolean,
  resetSlider: boolean,
  forceUpdateGuiCounter: number,
  uniqueIdentifier?: string,
  transactionMetadata: EdgeMetadata | null,
  isEditable: boolean,
  authRequired: 'pin' | 'none',
  address: string,
  exchangeRates: { [string]: number },
  coreWallet: EdgeCurrencyWallet,
  sceneState: SendConfirmationState,
  toggleCryptoOnTop: number,
  guiWallet: GuiWallet,
  isConnected: boolean
}

export type SendConfirmationDispatchProps = {
  updateSpendPending: boolean => any,
  signBroadcastAndSave: () => any,
  reset: () => any,
  updateAmount: (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string) => any,
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo) => any,
  onChangePin: (pin: string) => mixed,
  uniqueIdentifierButtonPressed: () => void,
  newSpendInfo: (EdgeSpendInfo, AuthType) => mixed,
  updateTransaction: (?EdgeTransaction, ?GuiMakeSpendInfo, ?boolean, ?Error) => void,
  getAuthRequiredDispatch: EdgeSpendInfo => void
}

type SendConfirmationRouterParams = {
  guiMakeSpendInfo: GuiMakeSpendInfo
}

type Props = SendConfirmationStateProps & SendConfirmationDispatchProps & SendConfirmationRouterParams

type State = {|
  secondaryDisplayDenomination: GuiDenomination,
  nativeAmount: string,
  overridePrimaryExchangeAmount: string,
  forceUpdateGuiCounter: number,
  keyboardVisible: boolean,
  showSpinner: boolean,
  isFiatOnTop: boolean,
  isFocus: boolean
|}

export class SendConfirmation extends Component<Props, State> {
  pinInput: any
  flipInput: any

  constructor (props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
    this.state = {
      secondaryDisplayDenomination: {
        name: '',
        multiplier: '1',
        symbol: ''
      },
      overridePrimaryExchangeAmount: '',
      keyboardVisible: false,
      forceUpdateGuiCounter: 0,
      nativeAmount: props.nativeAmount,
      showSpinner: false,
      isFiatOnTop: !!(props.guiMakeSpendInfo && props.guiMakeSpendInfo.nativeAmount && bns.eq(props.guiMakeSpendInfo.nativeAmount, '0')),
      isFocus: !!(props.guiMakeSpendInfo && props.guiMakeSpendInfo.nativeAmount && bns.eq(props.guiMakeSpendInfo.nativeAmount, '0'))
    }
    this.flipInput = React.createRef()
  }

  componentDidMount () {
    const secondaryDisplayDenomination = getDenomFromIsoCode(this.props.fiatCurrencyCode)
    const overridePrimaryExchangeAmount = bns.div(this.props.nativeAmount, this.props.primaryExchangeDenomination.multiplier, DIVIDE_PRECISION)
    const guiMakeSpendInfo = this.props.guiMakeSpendInfo
    let keyboardVisible = true
    // Do not show the keyboard if the caller passed in an amount
    if (guiMakeSpendInfo.nativeAmount) {
      if (!bns.eq(guiMakeSpendInfo.nativeAmount, '0')) {
        keyboardVisible = false
      }
    } else if (guiMakeSpendInfo.spendTargets && guiMakeSpendInfo.spendTargets.length) {
      keyboardVisible = false
    }

    this.props.sendConfirmationUpdateTx(this.props.guiMakeSpendInfo)
    this.setState({ secondaryDisplayDenomination, overridePrimaryExchangeAmount, keyboardVisible })
  }

  componentDidUpdate (prevProps: Props) {
    if (!prevProps.transactionMetadata && this.props.transactionMetadata && this.props.authRequired !== 'none' && this.props.nativeAmount !== '0') {
      this.pinInput.focus()
    }
    if (prevProps.toggleCryptoOnTop !== this.props.toggleCryptoOnTop) {
      this.flipInput.current.toggleCryptoOnTop()
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    const newState = {}
    if (nextProps.forceUpdateGuiCounter !== this.state.forceUpdateGuiCounter) {
      const overridePrimaryExchangeAmount = bns.div(nextProps.nativeAmount, nextProps.primaryExchangeDenomination.multiplier, DIVIDE_PRECISION)
      newState.overridePrimaryExchangeAmount = overridePrimaryExchangeAmount
      newState.forceUpdateGuiCounter = nextProps.forceUpdateGuiCounter
    }
    if (nextProps.fiatCurrencyCode !== this.props.fiatCurrencyCode) {
      newState.secondaryDisplayDenomination = getDenomFromIsoCode(nextProps.fiatCurrencyCode)
    }

    const feeCalculated = !!nextProps.networkFee || !!nextProps.parentNetworkFee
    if (feeCalculated || nextProps.errorMsg || nextProps.nativeAmount === '0') {
      newState.showSpinner = false
    }

    this.setState(newState)
  }

  componentWillUnmount () {
    this.props.reset()
    if (this.props.guiMakeSpendInfo && this.props.guiMakeSpendInfo.onBack) {
      this.props.guiMakeSpendInfo.onBack()
    }
  }

  render () {
    const { networkFee, parentNetworkFee, guiWallet } = this.props
    const primaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.currencyCode,
      displayDenomination: this.props.primaryDisplayDenomination,
      exchangeCurrencyCode: this.props.primaryExchangeDenomination.name,
      exchangeDenomination: this.props.primaryExchangeDenomination
    }

    let exchangeCurrencyCode = this.props.secondaryExchangeCurrencyCode

    if (this.props.secondaryExchangeCurrencyCode === '') {
      // There is no `EdgeDenomination.currencyCode`,
      // so this should never even run: $FlowFixMe
      if (this.state.secondaryDisplayDenomination.currencyCode) {
        exchangeCurrencyCode = this.state.secondaryDisplayDenomination.name
      }
    }

    const secondaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.fiatCurrencyCode,
      displayDenomination: this.state.secondaryDisplayDenomination,
      exchangeCurrencyCode: exchangeCurrencyCode,
      exchangeDenomination: this.state.secondaryDisplayDenomination
    }

    const cryptoBalanceAmount: string = convertNativeToDisplay(primaryInfo.displayDenomination.multiplier)(this.props.balanceInCrypto) // convert to correct denomination
    const cryptoBalanceAmountString = cryptoBalanceAmount ? intl.formatNumber(decimalOrZero(bns.toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
    const balanceInFiatString = intl.formatNumber(this.props.balanceInFiat || 0, { toFixed: 2 })

    const { address, authRequired, currencyCode, transactionMetadata, uniqueIdentifier, currencyInfo } = this.props
    const addressExplorer = currencyInfo ? currencyInfo.addressExplorer : null
    const destination = transactionMetadata ? transactionMetadata.name : ''
    const DESTINATION_TEXT = sprintf(s.strings.send_confirmation_to, destination)
    const ADDRESS_TEXT = sprintf(s.strings.send_confirmation_address, address)
    const fioAddress = this.props.guiMakeSpendInfo && this.props.guiMakeSpendInfo.fioAddress ? this.props.guiMakeSpendInfo.fioAddress : ''
    const memo = this.props.guiMakeSpendInfo && this.props.guiMakeSpendInfo.memo ? this.props.guiMakeSpendInfo.memo : ''
    const displayAddress = fioAddress ? '' : address

    const feeCalculated = !!networkFee || !!parentNetworkFee

    const sliderDisabled =
      this.props.sliderDisabled || !feeCalculated || (!getSpecialCurrencyInfo(this.props.currencyCode).allowZeroTx && this.props.nativeAmount === '0')

    const isTaggableCurrency = !!getSpecialCurrencyInfo(currencyCode).uniqueIdentifier
    const networkFeeData = this.getNetworkFeeData()

    const flipInputHeaderText = guiWallet ? sprintf(s.strings.send_from_wallet, guiWallet.name) : ''
    const flipInputHeaderLogo = guiWallet.symbolImageDarkMono
    return (
      <Fragment>
        <SceneWrapper>
          <View style={styles.mainScrollView}>
            <View style={[styles.balanceContainer, styles.error]}>
              <Text style={styles.balanceText}>
                {s.strings.send_confirmation_balance} {cryptoBalanceAmountString} {primaryInfo.displayDenomination.name} (
                {secondaryInfo.displayDenomination.symbol} {balanceInFiatString})
              </Text>
            </View>

            <View style={[styles.exchangeRateContainer, styles.error]}>
              {this.props.errorMsg ? (
                <Text style={[styles.error, styles.errorText]} numberOfLines={3}>
                  {this.props.errorMsg}
                </Text>
              ) : (
                <ExchangeRate secondaryDisplayAmount={this.props.fiatPerCrypto} primaryInfo={primaryInfo} secondaryInfo={secondaryInfo} />
              )}
            </View>

            <View style={styles.main}>
              <ExchangedFlipInput
                headerText={flipInputHeaderText}
                headerLogo={flipInputHeaderLogo}
                primaryCurrencyInfo={{ ...primaryInfo }}
                secondaryCurrencyInfo={{ ...secondaryInfo }}
                exchangeSecondaryToPrimaryRatio={this.props.fiatPerCrypto}
                overridePrimaryExchangeAmount={this.state.overridePrimaryExchangeAmount}
                forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
                onExchangeAmountChanged={this.onExchangeAmountChanged}
                keyboardVisible={this.state.keyboardVisible}
                isEditable={this.props.isEditable}
                isFiatOnTop={this.state.isFiatOnTop}
                isFocus={this.state.isFocus}
                ref={this.flipInput}
              />

              <Scene.Padding style={{ paddingHorizontal: 54 }}>
                <Scene.Item style={{ alignItems: 'center', flex: -1 }}>
                  <Scene.Row style={{ paddingVertical: 4 }}>
                    <Text style={[styles.feeAreaText, networkFeeData.feeStyle]}>{networkFeeData.feeSyntax}</Text>
                  </Scene.Row>

                  {!!destination && (
                    <Scene.Row style={{ paddingVertical: 10 }}>
                      <Recipient.Text style={{}}>
                        <Text>{DESTINATION_TEXT}</Text>
                      </Recipient.Text>
                    </Scene.Row>
                  )}

                  {!!displayAddress && (
                    <AddressTextWithBlockExplorerModal address={address} addressExplorer={addressExplorer}>
                      <Scene.Row style={{ paddingVertical: 4 }}>
                        <Recipient.Text style={{}}>
                          <Text>{ADDRESS_TEXT}</Text>
                        </Recipient.Text>
                      </Scene.Row>
                    </AddressTextWithBlockExplorerModal>
                  )}

                  {!!fioAddress && (
                    <Scene.Row style={{ paddingVertical: 10 }}>
                      <Recipient.Text style={{}}>
                        <Text>{sprintf(s.strings.fio_address, fioAddress)}</Text>
                      </Recipient.Text>
                    </Scene.Row>
                  )}

                  {!!memo && (
                    <Scene.Row style={{ paddingBottom: 5, paddingTop: 10 }}>
                      <Recipient.Text style={{}}>
                        <Text>{fioAddress ? s.strings.unique_identifier_memo : ''}:</Text>
                      </Recipient.Text>
                    </Scene.Row>
                  )}

                  {!!memo && (
                    <Scene.Row style={{ paddingTop: 0, paddingBottom: 10 }}>
                      <Text style={styles.rowText}>{memo}</Text>
                    </Scene.Row>
                  )}

                  {isTaggableCurrency && (
                    <Scene.Row style={{ paddingVertical: 10 }}>
                      <TouchableOpacity
                        activeOpacity={rawStyles.activeOpacity}
                        style={styles.addUniqueIDButton}
                        onPress={this.props.uniqueIdentifierButtonPressed}
                      >
                        <Text style={styles.addUniqueIDButtonText} ellipsizeMode={'tail'}>
                          {uniqueIdentifierText(currencyCode, uniqueIdentifier)}
                        </Text>
                      </TouchableOpacity>
                    </Scene.Row>
                  )}

                  {authRequired === 'pin' && (
                    <Scene.Row style={{ paddingBottom: 10, width: '100%', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Text style={styles.rowText}>{s.strings.four_digit_pin}</Text>

                      <View style={styles.pinInputSpacer} />

                      <View style={styles.pinInputContainer}>
                        <PinInput ref={ref => (this.pinInput = ref)} onChangePin={this.handleChangePin} returnKeyType="done" />
                      </View>
                    </Scene.Row>
                  )}
                </Scene.Item>
              </Scene.Padding>
            </View>
            <Scene.Footer style={[styles.footer, isTaggableCurrency && styles.footerWithPaymentId]}>
              <ABSlider
                forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
                resetSlider={this.props.resetSlider}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.props.signBroadcastAndSave}
                sliderDisabled={sliderDisabled}
                showSpinner={this.state.showSpinner || this.props.pending}
              />
            </Scene.Footer>
          </View>
        </SceneWrapper>
        {isTaggableCurrency && (
          <UniqueIdentifierModal
            onConfirm={this.props.sendConfirmationUpdateTx}
            currencyCode={currencyCode}
            keyboardType={getSpecialCurrencyInfo(currencyCode).uniqueIdentifier.identifierKeyboardType}
          />
        )}
      </Fragment>
    )
  }

  handleChangePin = (pin: string) => {
    this.props.onChangePin(pin)
    if (pin.length >= 4) {
      this.pinInput.blur()
    }
  }

  onExchangeAmountChanged = async ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {
    const { fiatPerCrypto, coreWallet, sceneState, currencyCode, newSpendInfo, updateTransaction, getAuthRequiredDispatch, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    this.setState({ showSpinner: true })
    const amountFiatString: string = bns.mul(exchangeAmount, fiatPerCrypto.toString())
    const amountFiat: number = parseFloat(amountFiatString)
    const metadata: EdgeMetadata = { amountFiat }
    const guiMakeSpendInfo = { nativeAmount, metadata }

    const guiMakeSpendInfoClone = { ...guiMakeSpendInfo }
    const spendInfo = getSpendInfoWithoutState(guiMakeSpendInfoClone, sceneState, currencyCode)
    const authType: any = getAuthRequiredDispatch(spendInfo) // Type casting any cause dispatch returns a function
    try {
      newSpendInfo(spendInfo, authType)
      const edgeTransaction = await coreWallet.makeSpend(spendInfo)
      updateTransaction(edgeTransaction, guiMakeSpendInfoClone, false, null)
      this.setState({ showSpinner: false })
    } catch (e) {
      console.log(e)
      updateTransaction(null, guiMakeSpendInfoClone, false, e)
    }
  }

  getNetworkFeeData = (): { feeSyntax: string, feeStyle: Object } => {
    const { networkFee, parentNetworkFee, parentDisplayDenomination, exchangeRates } = this.props
    let feeStyle = {}

    const primaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.currencyCode,
      displayDenomination: this.props.primaryDisplayDenomination,
      exchangeCurrencyCode: this.props.primaryExchangeDenomination.name,
      exchangeDenomination: this.props.primaryExchangeDenomination
    }

    let exchangeCurrencyCode = this.props.secondaryExchangeCurrencyCode

    if (this.props.secondaryExchangeCurrencyCode === '') {
      // There is no `EdgeDenomination.currencyCode`,
      // so this should never even run: $FlowFixMe
      if (this.state.secondaryDisplayDenomination.currencyCode) {
        exchangeCurrencyCode = this.state.secondaryDisplayDenomination.name
      }
    }

    const secondaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.fiatCurrencyCode,
      displayDenomination: this.state.secondaryDisplayDenomination,
      exchangeCurrencyCode: exchangeCurrencyCode,
      exchangeDenomination: this.state.secondaryDisplayDenomination
    }

    let denomination, exchangeDenomination, usedNetworkFee, currencyCode
    if (!networkFee && !parentNetworkFee) {
      // if no fee
      const cryptoFeeSymbolParent = parentDisplayDenomination.symbol ? parentDisplayDenomination.symbol : null
      const cryptoFeeSymbolPrimary = primaryInfo.displayDenomination.symbol ? primaryInfo.displayDenomination.symbol : null
      const cryptoFeeSymbol = () => {
        if (cryptoFeeSymbolParent) return cryptoFeeSymbolParent
        if (cryptoFeeSymbolPrimary) return cryptoFeeSymbolPrimary
        return ''
      }
      const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol ? secondaryInfo.displayDenomination.symbol : ''
      return {
        feeSyntax: sprintf(s.strings.send_confirmation_fee_line, `${cryptoFeeSymbol()} 0`, `${fiatFeeSymbol} 0`),
        feeStyle
      }
      // if parentNetworkFee greater than zero
    }
    if (parentNetworkFee && bns.gt(parentNetworkFee, '0')) {
      denomination = parentDisplayDenomination
      exchangeDenomination = this.props.parentExchangeDenomination
      usedNetworkFee = parentNetworkFee
      currencyCode = exchangeDenomination.name
      // if networkFee greater than zero
    } else if (networkFee && bns.gt(networkFee, '0')) {
      denomination = primaryInfo.displayDenomination
      exchangeDenomination = this.props.primaryExchangeDenomination
      usedNetworkFee = networkFee
      currencyCode = this.props.currencyCode
    } else {
      // catch-all scenario if only existing fee is negative (shouldn't be possible)
      return {
        feeSyntax: '',
        feeStyle: {}
      }
    }
    const cryptoFeeSymbol = denomination.symbol ? denomination.symbol : ''
    const displayDenomMultiplier = denomination.multiplier
    const cryptoFeeMultiplier = exchangeDenomination.multiplier
    const cryptoFeeExchangeDenomAmount = usedNetworkFee ? convertNativeToDisplay(cryptoFeeMultiplier)(usedNetworkFee) : ''

    const exchangeToDisplayMultiplierRatio = bns.div(cryptoFeeMultiplier, displayDenomMultiplier, DIVIDE_PRECISION)
    const cryptoFeeDisplayDenomAmount = bns.mul(cryptoFeeExchangeDenomAmount, exchangeToDisplayMultiplierRatio)
    const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeDisplayDenomAmount}`
    const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol ? secondaryInfo.displayDenomination.symbol : ''
    const exchangeConvertor = convertNativeToExchange(exchangeDenomination.multiplier)
    const cryptoFeeExchangeAmount = exchangeConvertor(usedNetworkFee)
    const fiatFeeAmount = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, secondaryInfo.exchangeCurrencyCode, parseFloat(cryptoFeeExchangeAmount))
    const fiatFeeAmountString = fiatFeeAmount.toFixed(2)
    const fiatFeeAmountPretty = bns.toFixed(fiatFeeAmountString, 2, 2)
    const fiatFeeString = `${fiatFeeSymbol} ${fiatFeeAmountPretty}`
    const feeAmountInUSD = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, 'iso:USD', parseFloat(cryptoFeeExchangeAmount))
    // check if fee is high enough to signal a warning to user (via font color)
    if (feeAmountInUSD > FEE_ALERT_THRESHOLD) {
      feeStyle = styles.feeDanger
    } else if (feeAmountInUSD > FEE_COLOR_THRESHOLD) {
      feeStyle = styles.feeWarning
    }
    return {
      feeSyntax: sprintf(s.strings.send_confirmation_fee_line, cryptoFeeString, fiatFeeString),
      feeStyle
    }
  }
}

export const uniqueIdentifierText = (currencyCode: string, uniqueIdentifier?: string): string => {
  if (!getSpecialCurrencyInfo(currencyCode).uniqueIdentifier) {
    throw new Error('Invalid currency code')
  }
  const uniqueIdentifierInfo = getSpecialCurrencyInfo(currencyCode).uniqueIdentifier
  if (!uniqueIdentifier) {
    return uniqueIdentifierInfo.addButtonText
  } else {
    return sprintf(`${uniqueIdentifierInfo.identifierName}: %s`, uniqueIdentifier)
  }
}
