// @flow

import { div, eq } from 'biggystring'
import { type EdgeDenomination, asMaybeNoAmountSpecifiedError } from 'edge-core-js'
import * as React from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import { updateMaxSpend, updateTransactionAmount } from '../../actions/SendConfirmationActions.js'
import { MINIMUM_DEVICE_HEIGHT } from '../../constants/constantSettings.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { getExchangeRate } from '../../selectors/WalletSelectors.js'
import { deviceHeight } from '../../theme/variables/platform.js'
import { connect } from '../../types/reactRedux.js'
import type { GuiCurrencyInfo } from '../../types/types.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { getAvailableBalance, getWalletFiat, getWalletName } from '../../util/CurrencyWalletHelpers.js'
import { convertTransactionFeeToDisplayFee, DECIMAL_PRECISION, DEFAULT_TRUNCATE_PRECISION, getDenomFromIsoCode, truncateDecimals } from '../../util/utils.js'
import { ExchangeRate } from '../common/ExchangeRate.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Card } from '../themed/Card'
import { EdgeText } from '../themed/EdgeText.js'
import { type ExchangedFlipInputAmounts, ExchangedFlipInput } from '../themed/ExchangedFlipInput'
import { FiatText } from '../themed/FiatText.js'
import { MiniButton } from '../themed/MiniButton.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<void>,
  walletId: string,
  currencyCode: string,
  onFeesChange: () => void,
  onMaxSet?: () => void,
  onAmountChanged?: (nativeAmount: string, exchangeAmount: string) => void,
  overrideExchangeAmount?: string
}

type StateProps = {
  // Balance
  balanceCrypto: string,

  // FlipInput
  flipInputHeaderText: string,
  flipInputHeaderLogo: string,
  primaryInfo: GuiCurrencyInfo,
  secondaryInfo: GuiCurrencyInfo,
  fiatPerCrypto: string,
  overridePrimaryExchangeAmount: string,
  forceUpdateGuiCounter: number,
  pluginId: string,

  // Fees
  feeCurrencyCode: string,
  feeDisplayDenomination: EdgeDenomination,
  feeExchangeDenomination: EdgeDenomination,
  feeNativeAmount: string,
  feeAmount: string,
  feeStyle?: string,

  // Error
  errorMessage?: string
}

type DispatchProps = {
  updateMaxSpend: (walletId: string, currencyCode: string) => void,
  updateTransactionAmount: (nativeAmount: string, exchangeAmount: string, walletId: string, currencyCode: string) => void
}

type State = {
  overridePrimaryExchangeAmount: string,
  forceUpdateGuiCounter: number,
  errorMessage?: string
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class FlipInputModalComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      overridePrimaryExchangeAmount: props.overrideExchangeAmount ?? props.overridePrimaryExchangeAmount,
      forceUpdateGuiCounter: 0
    }
  }

  handleCloseModal = () => this.props.bridge.resolve()

  handleFeesChange = () => {
    this.handleCloseModal()
    this.props.onFeesChange()
  }

  handleExchangeAmountChange = ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {
    const { walletId, currencyCode, updateTransactionAmount, onAmountChanged } = this.props
    if (onAmountChanged != null) return onAmountChanged(nativeAmount, exchangeAmount)
    updateTransactionAmount(nativeAmount, exchangeAmount, walletId, currencyCode)
  }

  handleAmountChangeError = (errorMessage?: string) => this.setState({ errorMessage })

  componentDidUpdate(prevProps: Props) {
    if (this.props.forceUpdateGuiCounter !== this.state.forceUpdateGuiCounter) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        overridePrimaryExchangeAmount: this.props.overridePrimaryExchangeAmount,
        forceUpdateGuiCounter: this.props.forceUpdateGuiCounter
      })
    }
  }

  handleSendMaxAmount = () => {
    if (this.props.onMaxSet != null) {
      this.props.onMaxSet()
      return this.handleCloseModal()
    }
    return this.props.updateMaxSpend(this.props.walletId, this.props.currencyCode)
  }

  renderErrorMessge = () => {
    const { errorMessage = this.state.errorMessage, theme } = this.props
    const styles = getStyles(theme)
    const opacity = errorMessage == null ? 0 : 1
    return (
      <EdgeText numberOfLines={1} style={[styles.exchangeRateErrorText, { opacity }]}>
        {errorMessage == null ? ' ' : errorMessage.split('\n')[0]}
      </EdgeText>
    )
  }

  renderExchangeRates = () => {
    const { primaryInfo, secondaryInfo, fiatPerCrypto, theme } = this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.rateBalanceContainer}>
        <EdgeText style={styles.secondaryTitle}>{s.strings.string_rate}</EdgeText>
        <ExchangeRate primaryInfo={primaryInfo} secondaryInfo={secondaryInfo} secondaryDisplayAmount={fiatPerCrypto} style={styles.rateBalanceText} />
      </View>
    )
  }

  renderBalance = () => {
    const { balanceCrypto, primaryInfo, secondaryInfo, theme } = this.props
    const styles = getStyles(theme)
    const { multiplier, name } = primaryInfo.displayDenomination
    const balance = `${formatNumber(div(balanceCrypto, multiplier, DECIMAL_PRECISION))} ${name} `
    return (
      <View style={styles.rateBalanceContainer}>
        <EdgeText style={styles.secondaryTitle}>{s.strings.send_confirmation_balance}</EdgeText>
        <EdgeText style={styles.rateBalanceText}>
          {balance}
          <FiatText
            nativeCryptoAmount={balanceCrypto}
            cryptoCurrencyCode={primaryInfo.exchangeCurrencyCode}
            isoFiatCurrencyCode={secondaryInfo.exchangeCurrencyCode}
            cryptoExchangeMultiplier={primaryInfo.exchangeDenomination.multiplier}
            parenthesisEnclosed
          />
        </EdgeText>
      </View>
    )
  }

  renderFlipInput = () => {
    const { flipInputHeaderText, flipInputHeaderLogo, primaryInfo, secondaryInfo, fiatPerCrypto, pluginId } = this.props
    const { overridePrimaryExchangeAmount } = this.state
    return (
      <Card marginRem={0}>
        <ExchangedFlipInput
          headerText={flipInputHeaderText}
          headerLogo={flipInputHeaderLogo}
          primaryCurrencyInfo={{ ...primaryInfo }}
          secondaryCurrencyInfo={{ ...secondaryInfo }}
          exchangeSecondaryToPrimaryRatio={fiatPerCrypto}
          overridePrimaryExchangeAmount={overridePrimaryExchangeAmount}
          forceUpdateGuiCounter={0}
          onExchangeAmountChanged={this.handleExchangeAmountChange}
          onError={this.handleAmountChangeError}
          onNext={this.handleCloseModal}
          keyboardVisible={false}
          isFocus
          isFiatOnTop={eq(overridePrimaryExchangeAmount, '0')}
        />
        {getSpecialCurrencyInfo(pluginId).noMaxSpend !== true ? (
          <MiniButton alignSelf="center" label={s.strings.string_max_cap} marginRem={[1.2, 0, 0]} onPress={this.handleSendMaxAmount} />
        ) : null}
      </Card>
    )
  }

  renderFees = () => {
    const { feeAmount, feeCurrencyCode, feeDisplayDenomination, feeExchangeDenomination, feeNativeAmount, feeStyle, secondaryInfo, theme } = this.props
    const truncatedFeeAmount = truncateDecimals(feeAmount, DEFAULT_TRUNCATE_PRECISION, false)
    const feeCryptoText = `${truncatedFeeAmount} ${feeDisplayDenomination.name} `
    const styles = getStyles(theme)
    const feeTextStyle = feeStyle === 'dangerText' ? styles.feeTextDanger : feeStyle === 'warningText' ? styles.feeTextWarning : styles.feeTextDefault
    return (
      <View style={styles.feeContainer}>
        <View style={styles.feeTitleContainer}>
          <EdgeText style={styles.primaryTitle}>{s.strings.string_fee}</EdgeText>
          <FontAwesomeIcon name="edit" style={styles.feeIcon} size={theme.rem(0.75)} />
        </View>
        <EdgeText style={feeTextStyle}>
          {feeCryptoText}
          <FiatText
            nativeCryptoAmount={feeNativeAmount}
            cryptoCurrencyCode={feeCurrencyCode}
            isoFiatCurrencyCode={secondaryInfo.exchangeCurrencyCode}
            cryptoExchangeMultiplier={feeExchangeDenomination.multiplier}
            parenthesisEnclosed
          />
        </EdgeText>
      </View>
    )
  }

  render() {
    const { theme } = this.props
    const styles = getStyles(theme)
    return (
      <ThemedModal bridge={this.props.bridge} onCancel={this.handleCloseModal}>
        {/* Extra view needed here to fullscreen the modal on small devices */}
        <View style={styles.hackContainer}>
          <View style={styles.flipInput}>{this.renderFlipInput()}</View>
          <TouchableWithoutFeedback onPress={this.handleFeesChange} style={styles.content}>
            <View>
              {this.renderFees()}
              {this.renderExchangeRates()}
              {this.renderBalance()}
              {this.renderErrorMessge()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  hackContainer: {
    flex: deviceHeight <= MINIMUM_DEVICE_HEIGHT ? 1 : 0
  },
  flipInput: {
    justifyContent: 'flex-start'
  },
  content: {
    justifyContent: 'flex-end'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerMaxAmountText: {
    color: theme.textLink
  },
  primaryTitle: {
    color: theme.secondaryText
  },
  secondaryTitle: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  rateBalanceContainer: {
    flexDirection: 'row'
  },
  exchangeRateErrorText: {
    fontSize: theme.rem(0.75),
    color: theme.dangerText
  },
  rateBalanceText: {
    fontSize: theme.rem(0.75)
  },
  feeContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(1)
  },
  feeTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  feeTextDefault: {
    color: theme.primaryText
  },
  feeTextWarning: {
    color: theme.warningText
  },
  feeTextDanger: {
    color: theme.dangerText
  },
  feeIcon: {
    color: theme.iconTappable,
    marginLeft: theme.rem(0.5)
  }
}))

export const FlipInputModal = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    const { walletId, currencyCode } = ownProps
    const wallet = state.core.account.currencyWallets[walletId]
    const name = getWalletName(wallet)
    const { fiatCurrencyCode, isoFiatCurrencyCode } = getWalletFiat(wallet)
    const { pluginId, metaTokens } = wallet.currencyInfo
    const contractAddress = metaTokens.find(token => token.currencyCode === currencyCode)?.contractAddress
    const { symbolImageDarkMono } = getCurrencyIcon(pluginId, contractAddress)

    // Denominations
    const cryptoDenomination = getDisplayDenomination(state, pluginId, currencyCode)
    const cryptoExchangeDenomination = getExchangeDenomination(state, pluginId, currencyCode)
    const fiatDenomination = getDenomFromIsoCode(fiatCurrencyCode)

    // FlipInput
    const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

    const primaryInfo = {
      displayCurrencyCode: currencyCode,
      displayDenomination: cryptoDenomination,
      exchangeCurrencyCode: cryptoExchangeDenomination.name,
      exchangeDenomination: cryptoExchangeDenomination
    }

    const secondaryInfo = {
      displayCurrencyCode: fiatCurrencyCode,
      displayDenomination: fiatDenomination,
      exchangeCurrencyCode: isoFiatCurrencyCode,
      exchangeDenomination: fiatDenomination
    }

    const { forceUpdateGuiCounter, nativeAmount } = state.ui.scenes.sendConfirmation
    const overridePrimaryExchangeAmount = div(nativeAmount, primaryInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)

    // Fees
    const feeDisplayDenomination = getDisplayDenomination(state, pluginId, wallet.currencyInfo.currencyCode)
    const feeExchangeDenomination = getExchangeDenomination(state, pluginId, wallet.currencyInfo.currencyCode)
    const transactionFee = convertTransactionFeeToDisplayFee(
      wallet,
      state.exchangeRates,
      state.ui.scenes.sendConfirmation.transaction,
      feeDisplayDenomination,
      feeExchangeDenomination
    )

    // Error
    const error = state.ui.scenes.sendConfirmation.error
    let errorMessage
    if (error && error.message !== 'broadcastError' && error.message !== 'transactionCancelled' && asMaybeNoAmountSpecifiedError(error) == null) {
      errorMessage = error.message
    }

    return {
      // Balances
      balanceCrypto: getAvailableBalance(wallet),

      // FlipInput
      flipInputHeaderText: sprintf(s.strings.send_from_wallet, name),
      flipInputHeaderLogo: symbolImageDarkMono,
      primaryInfo,
      secondaryInfo,
      fiatPerCrypto: fiatPerCrypto ?? '0',
      overridePrimaryExchangeAmount,
      forceUpdateGuiCounter,
      pluginId,

      // Fees
      feeCurrencyCode: wallet.currencyInfo.currencyCode,
      feeDisplayDenomination,
      feeExchangeDenomination,
      feeNativeAmount: transactionFee.nativeCryptoAmount,
      feeAmount: transactionFee.cryptoAmount,
      feeStyle: transactionFee.fiatStyle,

      // Error
      errorMessage
    }
  },
  dispatch => ({
    updateMaxSpend(walletId: string, currencyCode: string) {
      dispatch(updateMaxSpend(walletId, currencyCode))
    },
    updateTransactionAmount(nativeAmount: string, exchangeAmount: string, walletId: string, currencyCode: string) {
      dispatch(updateTransactionAmount(nativeAmount, exchangeAmount, walletId, currencyCode))
    }
  })
)(withTheme(FlipInputModalComponent))
