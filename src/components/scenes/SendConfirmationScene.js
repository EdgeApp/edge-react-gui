// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeDenomination, EdgeMetadata, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { TextField } from 'react-native-material-textfield'
import { sprintf } from 'sprintf-js'

import { type FioSenderInfo } from '../../actions/SendConfirmationActions'
import { UniqueIdentifierModalConnect as UniqueIdentifierModal } from '../../connectors/UniqueIdentifierModalConnector.js'
import { FEE_ALERT_THRESHOLD, FEE_COLOR_THRESHOLD, FIO_STR, getSpecialCurrencyInfo } from '../../constants/indexConstants'
import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { SelectFioAddressConnector as SelectFioAddress } from '../../modules/FioAddress/components/SelectFioAddress'
import { checkRecordSendFee, FIO_NO_BUNDLED_ERR_CODE } from '../../modules/FioAddress/util'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { ExchangedFlipInput } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Recipient from '../../modules/UI/components/Recipient/Recipient.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import { type AuthType, getSpendInfoWithoutState } from '../../modules/UI/scenes/SendConfirmation/selectors'
import { convertCurrencyFromExchangeRates } from '../../modules/UI/selectors.js'
import { type GuiMakeSpendInfo, type SendConfirmationState } from '../../reducers/scenes/SendConfirmationReducer.js'
import type { CurrencySetting } from '../../reducers/scenes/SettingsReducer'
import { THEME } from '../../theme/variables/airbitz.js'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { convertNativeToDisplay, convertNativeToExchange, decimalOrZero, getDenomFromIsoCode } from '../../util/utils.js'
import { AddressTextWithBlockExplorerModal } from '../common/AddressTextWithBlockExplorerModal'
import { ExchangeRate } from '../common/ExchangeRate.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'

const DIVIDE_PRECISION = 18

export type SendConfirmationStateProps = {
  fiatCurrencyCode: string,
  currencyInfo: EdgeCurrencyInfo | null,
  currencySettings: CurrencySetting,
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
  signBroadcastAndSave: (fioSender?: FioSenderInfo) => any,
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
  nativeAmount: string,
  overridePrimaryExchangeAmount: string,
  forceUpdateGuiCounter: number,
  keyboardVisible: boolean,
  showSpinner: boolean,
  isFiatOnTop: boolean,
  isFocus: boolean,
  fioSender: FioSenderInfo
|}

export class SendConfirmation extends React.Component<Props, State> {
  pinInput: any
  flipInput: any

  constructor(props: Props) {
    super(props)
    this.state = {
      overridePrimaryExchangeAmount: '',
      keyboardVisible: false,
      forceUpdateGuiCounter: 0,
      nativeAmount: props.nativeAmount,
      showSpinner: false,
      fioSender: {
        fioAddress: props.guiMakeSpendInfo && props.guiMakeSpendInfo.fioPendingRequest ? props.guiMakeSpendInfo.fioPendingRequest.payer_fio_address : '',
        fioWallet: null,
        fioError: '',
        memo: props.guiMakeSpendInfo && props.guiMakeSpendInfo.fioPendingRequest ? props.guiMakeSpendInfo.fioPendingRequest.content.memo : '',
        memoError: ''
      },
      isFiatOnTop: !!(props.guiMakeSpendInfo && props.guiMakeSpendInfo.nativeAmount && bns.eq(props.guiMakeSpendInfo.nativeAmount, '0')),
      isFocus: !!(props.guiMakeSpendInfo && props.guiMakeSpendInfo.nativeAmount && bns.eq(props.guiMakeSpendInfo.nativeAmount, '0'))
    }
    this.flipInput = React.createRef()
  }

  componentDidMount() {
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
    this.setState({ overridePrimaryExchangeAmount, keyboardVisible })
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.transactionMetadata && this.props.transactionMetadata && this.props.authRequired !== 'none' && this.props.nativeAmount !== '0') {
      this.pinInput.focus()
    }
    if (prevProps.toggleCryptoOnTop !== this.props.toggleCryptoOnTop) {
      this.flipInput.current.toggleCryptoOnTop()
    }

    if (this.props.forceUpdateGuiCounter !== this.state.forceUpdateGuiCounter) {
      this.setState({
        overridePrimaryExchangeAmount: bns.div(this.props.nativeAmount, this.props.primaryExchangeDenomination.multiplier, DIVIDE_PRECISION),
        forceUpdateGuiCounter: this.props.forceUpdateGuiCounter
      })
    }
  }

  componentWillUnmount() {
    this.props.reset()
    if (this.props.guiMakeSpendInfo && this.props.guiMakeSpendInfo.onBack) {
      this.props.guiMakeSpendInfo.onBack()
    }
  }

  render() {
    const secondaryDisplayDenomination = getDenomFromIsoCode(this.props.fiatCurrencyCode)

    const { networkFee, parentNetworkFee, guiWallet, nativeAmount, errorMsg } = this.props
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
      if (secondaryDisplayDenomination.currencyCode) {
        exchangeCurrencyCode = secondaryDisplayDenomination.name
      }
    }

    const secondaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.fiatCurrencyCode,
      displayDenomination: secondaryDisplayDenomination,
      exchangeCurrencyCode: exchangeCurrencyCode,
      exchangeDenomination: secondaryDisplayDenomination
    }

    const cryptoBalanceAmount: string = convertNativeToDisplay(primaryInfo.displayDenomination.multiplier)(this.props.balanceInCrypto) // convert to correct denomination
    const cryptoBalanceAmountString = cryptoBalanceAmount ? formatNumber(decimalOrZero(bns.toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
    const balanceInFiatString = formatNumber(this.props.balanceInFiat || 0, { toFixed: 2 })

    const { address, authRequired, currencyCode, transactionMetadata, uniqueIdentifier, currencyInfo } = this.props
    const addressExplorer = currencyInfo ? currencyInfo.addressExplorer : null
    const destination = transactionMetadata ? transactionMetadata.name : ''
    const DESTINATION_TEXT = sprintf(s.strings.send_confirmation_to, destination)
    const ADDRESS_TEXT = sprintf(s.strings.send_confirmation_address, address)
    const fioAddress = this.props.guiMakeSpendInfo && this.props.guiMakeSpendInfo.fioAddress ? this.props.guiMakeSpendInfo.fioAddress : ''
    const fioSender = this.state.fioSender
    const displayAddress = fioAddress ? '' : address

    const feeCalculated = !!networkFee || !!parentNetworkFee
    const showSpinner = (!feeCalculated && !errorMsg && nativeAmount !== '0') || this.state.showSpinner || this.props.pending
    const sliderDisabled =
      this.props.sliderDisabled ||
      !feeCalculated ||
      (!getSpecialCurrencyInfo(this.props.currencyCode).allowZeroTx && this.props.nativeAmount === '0') ||
      !!fioSender.fioError ||
      !!fioSender.memoError

    const uniqueIdentifierInfo = getSpecialCurrencyInfo(currencyCode).uniqueIdentifier
    const networkFeeData = this.getNetworkFeeData()

    const flipInputHeaderText = guiWallet ? sprintf(s.strings.send_from_wallet, guiWallet.name) : ''
    const flipInputHeaderLogo = guiWallet.symbolImageDarkMono
    return (
      <>
        <SceneWrapper background="header">
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
              {fioSender.fioError ? (
                <Text style={[styles.error, styles.errorText]} numberOfLines={2}>
                  {fioSender.fioError}
                </Text>
              ) : null}
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
                    <Text style={[styles.feeAreaText, { color: networkFeeData.feeColor }]}>{networkFeeData.feeSyntax}</Text>
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

                  {uniqueIdentifierInfo != null && (
                    <Scene.Row style={{ paddingVertical: 10 }}>
                      <TouchableOpacity
                        activeOpacity={THEME.OPACITY.ACTIVE}
                        style={styles.addUniqueIDButton}
                        onPress={this.props.uniqueIdentifierButtonPressed}
                      >
                        <Text style={styles.addUniqueIDButtonText} ellipsizeMode="tail">
                          {!uniqueIdentifier ? uniqueIdentifierInfo.addButtonText : sprintf(`${uniqueIdentifierInfo.identifierName}: %s`, uniqueIdentifier)}
                        </Text>
                      </TouchableOpacity>
                    </Scene.Row>
                  )}

                  {authRequired === 'pin' && (
                    <Scene.Row style={{ paddingBottom: 10, width: '100%', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Text style={styles.rowText}>{s.strings.four_digit_pin}</Text>

                      <View style={styles.pinInputSpacer} />

                      <View style={styles.pinInputContainer}>
                        <TextField
                          ref={ref => (this.pinInput = ref)}
                          baseColor={THEME.COLORS.WHITE}
                          textColor={THEME.COLORS.WHITE}
                          tintColor={THEME.COLORS.WHITE}
                          inputContainerStyle={{
                            marginTop: -14,
                            width: 45,
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          secureTextEntry
                          keyboardType="numeric"
                          label=""
                          maxLength={4}
                          onChangeText={this.handleChangePin}
                          returnKeyType="done"
                        />
                      </View>
                    </Scene.Row>
                  )}
                </Scene.Item>
              </Scene.Padding>

              <Scene.Padding style={{ paddingHorizontal: 54 }}>
                <Scene.Item style={{ alignItems: 'center', flex: -1 }}>
                  {!!fioAddress && (
                    <Scene.Row style={{ paddingTop: 10, paddingBottom: 0 }}>
                      <Recipient.Text style={{}}>
                        <Text>{sprintf(s.strings.send_to_title, fioAddress)}</Text>
                      </Recipient.Text>
                    </Scene.Row>
                  )}
                </Scene.Item>
              </Scene.Padding>

              <SelectFioAddress
                selected={fioSender.fioAddress}
                memo={fioSender.memo}
                memoError={fioSender.memoError}
                fioRequest={this.props.guiMakeSpendInfo ? this.props.guiMakeSpendInfo.fioPendingRequest : null}
                isSendUsingFioAddress={this.props.guiMakeSpendInfo ? this.props.guiMakeSpendInfo.isSendUsingFioAddress : null}
                onSelect={this.onFioAddressSelect}
                onMemoChange={this.onMemoChange}
              />
            </View>
            <Scene.Footer style={[styles.footer, uniqueIdentifierInfo != null && styles.footerWithPaymentId]}>
              <Slider
                forceUpdateGuiCounter={this.props.forceUpdateGuiCounter}
                resetSlider={this.props.resetSlider}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.signBroadcastAndSave}
                sliderDisabled={sliderDisabled}
                showSpinner={showSpinner}
              />
            </Scene.Footer>
          </View>
        </SceneWrapper>
        {uniqueIdentifierInfo != null && <UniqueIdentifierModal onConfirm={this.props.sendConfirmationUpdateTx} currencyCode={currencyCode} />}
      </>
    )
  }

  signBroadcastAndSave = async () => {
    const { guiMakeSpendInfo, currencyCode, updateSpendPending } = this.props
    if (guiMakeSpendInfo && (guiMakeSpendInfo.isSendUsingFioAddress || guiMakeSpendInfo.fioPendingRequest)) {
      const { fioSender } = this.state
      if (fioSender.fioWallet && fioSender.fioAddress && !guiMakeSpendInfo.fioPendingRequest) {
        updateSpendPending(true)
        try {
          await checkRecordSendFee(fioSender.fioWallet, fioSender.fioAddress)
        } catch (e) {
          updateSpendPending(false)
          if (e.code && e.code === FIO_NO_BUNDLED_ERR_CODE && currencyCode !== FIO_STR) {
            const answer = await Airship.show(bridge => (
              <ButtonsModal
                bridge={bridge}
                title={s.strings.fio_no_bundled_err_msg}
                message={`${s.strings.fio_no_bundled_non_fio_err_msg} ${s.strings.fio_no_bundled_renew_err_msg}`}
                buttons={{
                  ok: { label: s.strings.legacy_address_modal_continue },
                  cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
                }}
              />
            ))
            if (answer === 'ok') {
              fioSender.skipRecord = true
              this.props.signBroadcastAndSave(fioSender)
            }
            return
          }

          showError(e)
          return
        }
        updateSpendPending(false)
      }

      return this.props.signBroadcastAndSave(fioSender)
    }
    this.props.signBroadcastAndSave()
  }

  handleChangePin = (pin: string) => {
    this.props.onChangePin(pin)
    if (pin.length >= 4) {
      this.pinInput.blur()
    }
  }

  onExchangeAmountChanged = async ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {
    const { fiatPerCrypto, coreWallet, sceneState, currencyCode, newSpendInfo, updateTransaction, getAuthRequiredDispatch } = this.props
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

  getNetworkFeeData = (): { feeSyntax: string, feeColor: string } => {
    const secondaryDisplayDenomination = getDenomFromIsoCode(this.props.fiatCurrencyCode)
    const { networkFee, parentNetworkFee, parentDisplayDenomination, exchangeRates } = this.props
    let feeColor = THEME.COLORS.WHITE

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
      if (secondaryDisplayDenomination.currencyCode) {
        exchangeCurrencyCode = secondaryDisplayDenomination.name
      }
    }

    const secondaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.fiatCurrencyCode,
      displayDenomination: secondaryDisplayDenomination,
      exchangeCurrencyCode: exchangeCurrencyCode,
      exchangeDenomination: secondaryDisplayDenomination
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
        feeColor
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
        feeColor
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
      feeColor = THEME.COLORS.ACCENT_RED
    } else if (feeAmountInUSD > FEE_COLOR_THRESHOLD) {
      feeColor = THEME.COLORS.ACCENT_ORANGE
    }
    return {
      feeSyntax: sprintf(s.strings.send_confirmation_fee_line, cryptoFeeString, fiatFeeString),
      feeColor
    }
  }

  onFioAddressSelect = (fioAddress: string, fioWallet: EdgeCurrencyWallet, error: string) => {
    const { fioSender } = this.state
    fioSender.fioAddress = fioAddress
    fioSender.fioWallet = fioWallet
    fioSender.fioError = error
    this.setState({ fioSender })
  }

  onMemoChange = (memo: string, error: string) => {
    const { fioSender } = this.state
    fioSender.memo = memo
    fioSender.memoError = error
    this.setState({ fioSender })
  }
}

const rawStyles = {
  mainScrollView: {
    flex: 1,
    width: '100%',
    alignItems: 'center'
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: scale(12)
  },

  main: {
    alignItems: 'center',
    width: '100%'
  },
  feeAreaText: {
    fontSize: scale(16),
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },

  sliderStyle: {
    width: scale(270)
  },
  error: {
    marginHorizontal: scale(10),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  errorText: {
    textAlign: 'center',
    color: THEME.COLORS.ACCENT_RED
  },
  balanceText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
  },
  balanceContainer: {
    alignItems: 'center',
    marginTop: scale(10)
  },
  rowText: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    color: THEME.COLORS.WHITE
  },
  pinInputContainer: {
    width: scale(60),
    height: scale(50)
  },
  pinInputSpacer: {
    width: scale(10)
  },
  addUniqueIDButton: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    padding: scale(14),
    alignItems: 'center',
    justifyContent: 'center'
  },
  addUniqueIDButtonText: {
    color: THEME.COLORS.WHITE
  },
  footer: {
    marginTop: scale(12)
  },
  footerWithPaymentId: {
    marginTop: scale(0)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
