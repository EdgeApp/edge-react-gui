// @flow

import { bns } from 'biggystring'
import { asMaybeNoAmountSpecifiedError } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { updateMaxSpend, updateTransactionAmount } from '../../actions/SendConfirmationActions.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { convertCurrencyFromExchangeRates, convertNativeToExchangeRateDenomination, getExchangeRate } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import type { GuiCurrencyInfo } from '../../types/types.js'
import { convertTransactionFeeToDisplayFee, DECIMAL_PRECISION, getDenomFromIsoCode } from '../../util/utils.js'
import { ExchangeRate } from '../common/ExchangeRate.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Card } from '../themed/Card'
import { EdgeText } from '../themed/EdgeText.js'
import { type ExchangedFlipInputAmounts, ExchangedFlipInput } from '../themed/ExchangedFlipInput'
import { ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<void>,
  walletId: string,
  currencyCode: string
}

type StateProps = {
  // Balance
  balanceCrypto: string,
  balanceFiat: string,

  // FlipInput
  flipInputHeaderText: string,
  flipInputHeaderLogo: string,
  primaryInfo: GuiCurrencyInfo,
  secondaryInfo: GuiCurrencyInfo,
  fiatPerCrypto: string,
  overridePrimaryExchangeAmount: string,
  forceUpdateGuiCounter: number,

  // Fees
  feeSyntax: string,
  feeSyntaxStyle?: string,

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
      overridePrimaryExchangeAmount: props.overridePrimaryExchangeAmount,
      forceUpdateGuiCounter: 0
    }
  }

  handleCloseModal = () => this.props.bridge.resolve()

  handleExchangeAmountChange = ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {
    const { walletId, currencyCode, updateTransactionAmount } = this.props
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

  handleSendMaxAmount = () => this.props.updateMaxSpend(this.props.walletId, this.props.currencyCode)

  renderTitle = () => {
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.headerContainer}>
        <ModalTitle>{s.strings.string_enter_amount}</ModalTitle>
        {getSpecialCurrencyInfo(this.props.currencyCode).noMaxSpend !== true ? (
          <TouchableOpacity onPress={this.handleSendMaxAmount}>
            <EdgeText style={styles.headerMaxAmountText}>{s.strings.send_confirmation_max_button_title}</EdgeText>
          </TouchableOpacity>
        ) : null}
      </View>
    )
  }

  renderExchangeRates = () => {
    const { primaryInfo, secondaryInfo, errorMessage = this.state.errorMessage, fiatPerCrypto, theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.exchangeRateContainer}>
        {errorMessage != null ? (
          <EdgeText numberOfLines={1} style={styles.exchangeRateErrorText}>
            {errorMessage.split('\n')[0]}
          </EdgeText>
        ) : (
          <ExchangeRate primaryInfo={primaryInfo} secondaryInfo={secondaryInfo} secondaryDisplayAmount={fiatPerCrypto} />
        )}
      </View>
    )
  }

  renderBalance = () => {
    const { balanceCrypto, balanceFiat, theme } = this.props
    const styles = getStyles(theme)
    const balance = `${balanceCrypto} (${balanceFiat})`
    return (
      <View style={styles.balanceContainer}>
        <EdgeText style={styles.balanceString}>{s.strings.send_confirmation_balance}</EdgeText>
        <EdgeText style={styles.balanceValue}>{balance}</EdgeText>
      </View>
    )
  }

  renderFlipInput = () => {
    const { flipInputHeaderText, flipInputHeaderLogo, primaryInfo, secondaryInfo, fiatPerCrypto, theme } = this.props
    const { overridePrimaryExchangeAmount } = this.state
    const styles = getStyles(theme)
    return (
      <View style={styles.flipInputContainer}>
        <Card marginRem={[0, 0.75]}>
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
            isFiatOnTop={bns.eq(overridePrimaryExchangeAmount, '0')}
          />
        </Card>
      </View>
    )
  }

  renderFees = () => {
    const { feeSyntax, feeSyntaxStyle, theme } = this.props
    const styles = getStyles(theme)
    const feeText = `+ ${s.strings.string_fee}`
    const feeStyle =
      feeSyntaxStyle === 'dangerText' ? styles.feesSyntaxDanger : feeSyntaxStyle === 'warningText' ? styles.feesSyntaxWarning : styles.feesSyntaxDefault
    return (
      <View style={styles.feesContainer}>
        <EdgeText style={styles.feesContainerText}>{feeText}</EdgeText>
        <EdgeText style={feeStyle}>{feeSyntax}</EdgeText>
      </View>
    )
  }

  render() {
    return (
      <ThemedModal bridge={this.props.bridge} onCancel={this.handleCloseModal}>
        {this.renderTitle()}
        {this.renderExchangeRates()}
        {this.renderBalance()}
        {this.renderFlipInput()}
        {this.renderFees()}
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerMaxAmountText: {
    color: theme.textLink
  },
  balanceContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.rem(0.5)
  },
  exchangeRateContainer: {
    margin: theme.rem(0.5)
  },
  exchangeRateErrorText: {
    color: theme.dangerText
  },
  balanceValue: {
    textAlign: 'right'
  },
  balanceString: {
    flex: 1
  },
  flipInputContainer: {
    marginVertical: theme.rem(1)
  },
  feesContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.rem(1)
  },
  feesContainerText: {
    flex: 1
  },
  feesSyntaxDefault: {
    color: theme.primaryText
  },
  feesSyntaxWarning: {
    color: theme.warningText
  },
  feesSyntaxDanger: {
    color: theme.dangerText
  },
  spacer: {
    flex: 1
  }
}))

export const FlipInputModal = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    const { walletId, currencyCode } = ownProps
    const guiWallet = state.ui.wallets.byId[walletId]
    const { fiatCurrencyCode, isoFiatCurrencyCode } = guiWallet

    // Denominations
    const cryptoDenomination = getDisplayDenomination(state, currencyCode)
    const cryptoExchangeDenomination = getExchangeDenomination(state, currencyCode)
    const fiatDenomination = getDenomFromIsoCode(fiatCurrencyCode)

    // Balances
    const balanceInCrypto = guiWallet.nativeBalances[currencyCode]
    const balanceCrypto = convertNativeToExchangeRateDenomination(state.ui.settings, currencyCode, balanceInCrypto)
    const balanceFiat = convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, isoFiatCurrencyCode, balanceCrypto)

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
    const overridePrimaryExchangeAmount = bns.div(nativeAmount, primaryInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)

    // Fees
    const transactionFee = convertTransactionFeeToDisplayFee(
      guiWallet,
      currencyCode,
      state.exchangeRates,
      state.ui.scenes.sendConfirmation.transaction,
      state.ui.settings
    )
    const feeSyntax = `${transactionFee.cryptoSymbol || ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol || ''} ${transactionFee.fiatAmount})`
    const feeSyntaxStyle = transactionFee.fiatStyle

    // Error
    const error = state.ui.scenes.sendConfirmation.error
    let errorMessage
    if (error && error.message !== 'broadcastError' && error.message !== 'transactionCancelled' && asMaybeNoAmountSpecifiedError(error) == null) {
      errorMessage = error.message
    }

    return {
      // Balances
      balanceCrypto: `${balanceCrypto} ${currencyCode}`,
      balanceFiat: `${fiatDenomination.symbol ? fiatDenomination.symbol + ' ' : ''} ${bns.toFixed(balanceFiat, 2, 2)}`,

      // FlipInput
      flipInputHeaderText: sprintf(s.strings.send_from_wallet, guiWallet.name),
      flipInputHeaderLogo: guiWallet.symbolImageDarkMono || '',
      primaryInfo,
      secondaryInfo,
      fiatPerCrypto: fiatPerCrypto ?? '0',
      overridePrimaryExchangeAmount,
      forceUpdateGuiCounter,

      // Fees
      feeSyntax,
      feeSyntaxStyle,

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
