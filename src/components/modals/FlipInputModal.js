// @flow

import { bns } from 'biggystring'
import { errorNames } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { MenuProvider } from 'react-native-popup-menu'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { updateTransactionAmount } from '../../actions/SendConfirmationActions.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../modules/Settings/selectors.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { ExchangedFlipInput } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { convertCurrencyFromExchangeRates, convertNativeToExchangeRateDenomination, getExchangeRate } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { GuiCurrencyInfo } from '../../types/types.js'
import { calculateTransactionFee, DIVIDE_PRECISION, getDenomFromIsoCode } from '../../util/utils.js'
import { ExchangeRate } from '../common/ExchangeRate.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<void>,
  walletId: string,
  currencyCode: string,
  nativeAmount?: string
}

type StateProps = {
  balanceCrypto: string,
  balanceFiat: string,

  // FlipInput
  flipInputHeaderText: string,
  flipInputHeaderLogo: string,
  primaryInfo: GuiCurrencyInfo,
  secondaryInfo: GuiCurrencyInfo,
  fiatPerCrypto: number,
  overridePrimaryExchangeAmount: string,

  // Fees
  feeSyntax: string,
  feeSyntaxStyle?: string,

  // Error
  errorMessage?: string
}

type DispatchProps = {
  updateTransactionAmount: (nativeAmount: string, exchangeAmount: string, walletId: string, currencyCode: string) => void
}

type State = {
  overridePrimaryExchangeAmount: string
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class FlipInputModalComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      overridePrimaryExchangeAmount: props.overridePrimaryExchangeAmount
    }
  }

  handleCloseModal = () => this.props.bridge.resolve()

  handleExchangeAmountChange = ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {
    const { walletId, currencyCode, updateTransactionAmount } = this.props
    updateTransactionAmount(nativeAmount, exchangeAmount, walletId, currencyCode)
  }

  renderExchangeRates = () => {
    const { primaryInfo, secondaryInfo, fiatPerCrypto, errorMessage, theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.exchangeRateContainer}>
        {errorMessage ? (
          <EdgeText style={styles.exchangeRateErrorText}>{errorMessage}</EdgeText>
        ) : (
          <ExchangeRate primaryInfo={primaryInfo} secondaryInfo={secondaryInfo} secondaryDisplayAmount={fiatPerCrypto} />
        )}
      </View>
    )
  }

  renderBalance = () => {
    const { balanceCrypto, balanceFiat, theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.balanceContainer}>
        <EdgeText style={styles.balanceString}>{s.strings.send_confirmation_balance}</EdgeText>
        <View style={styles.balanceValueContainer}>
          <EdgeText style={styles.balanceValue}>{balanceFiat}</EdgeText>
          <EdgeText style={styles.balanceValue}>{balanceCrypto}</EdgeText>
        </View>
      </View>
    )
  }

  renderFlipInput = () => {
    const { flipInputHeaderText, flipInputHeaderLogo, primaryInfo, secondaryInfo, fiatPerCrypto, theme } = this.props
    const { overridePrimaryExchangeAmount } = this.state
    const styles = getStyles(theme)
    return (
      <View style={styles.flipInputContainer}>
        <ExchangedFlipInput
          headerText={flipInputHeaderText}
          headerLogo={flipInputHeaderLogo}
          primaryCurrencyInfo={{ ...primaryInfo }}
          secondaryCurrencyInfo={{ ...secondaryInfo }}
          exchangeSecondaryToPrimaryRatio={fiatPerCrypto}
          overridePrimaryExchangeAmount={overridePrimaryExchangeAmount}
          forceUpdateGuiCounter={0}
          onExchangeAmountChanged={this.handleExchangeAmountChange}
          onNext={this.handleCloseModal}
          keyboardVisible={false}
          isFocus
          isFiatOnTop={bns.eq(overridePrimaryExchangeAmount, '0')}
        />
      </View>
    )
  }

  renderFees = () => {
    const { feeSyntax, feeSyntaxStyle, theme } = this.props
    const styles = getStyles(theme)
    const feeText = `+ ${s.strings.string_fee}`
    return (
      <View style={styles.feesContainer}>
        <EdgeText style={styles.feesContainerText}>{feeText}</EdgeText>
        <EdgeText style={{ color: feeSyntaxStyle ? theme[feeSyntaxStyle] : theme.primaryText }}>{feeSyntax}</EdgeText>
      </View>
    )
  }

  render() {
    return (
      <MenuProvider style={{ flexDirection: 'row' }}>
        <ThemedModal bridge={this.props.bridge} onCancel={this.handleCloseModal}>
          <ModalTitle>{s.strings.string_enter_amount}</ModalTitle>
          {this.renderExchangeRates()}
          {this.renderBalance()}
          {this.renderFlipInput()}
          {this.renderFees()}
          <ModalCloseArrow onPress={this.handleCloseModal} />
        </ThemedModal>
      </MenuProvider>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
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
  balanceValueContainer: {
    flexDirection: 'column'
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
  }
}))

export const FlipInputModal = connect(
  (state: RootState, ownProps: OwnProps): StateProps => {
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
    const balanceFiat = convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, isoFiatCurrencyCode, parseFloat(balanceCrypto))

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

    const { nativeAmount } = state.ui.scenes.sendConfirmation
    const overridePrimaryExchangeAmount = bns.div(nativeAmount, primaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)

    // Fees
    const transactionFee = calculateTransactionFee(
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
    if (error && error.message !== 'broadcastError' && error.message !== 'transactionCancelled' && error.name !== errorNames.NoAmountSpecifiedError) {
      errorMessage = error.message
    }

    return {
      // Balances
      balanceCrypto: `${balanceCrypto} ${currencyCode}`,
      balanceFiat: `${fiatDenomination.symbol ? fiatDenomination.symbol + ' ' : ''} ${balanceFiat.toFixed(2)}`,

      // FlipInput
      flipInputHeaderText: sprintf(s.strings.send_from_wallet, guiWallet.name),
      flipInputHeaderLogo: guiWallet.symbolImageDarkMono || '',
      primaryInfo,
      secondaryInfo,
      fiatPerCrypto: fiatPerCrypto || 0,
      overridePrimaryExchangeAmount,

      // Fees
      feeSyntax,
      feeSyntaxStyle,

      // Error
      errorMessage
    }
  },
  (dispatch: Dispatch) => ({
    updateTransactionAmount: (nativeAmount: string, exchangeAmount: string, walletId: string, currencyCode: string) =>
      dispatch(updateTransactionAmount(nativeAmount, exchangeAmount, walletId, currencyCode))
  })
)(withTheme(FlipInputModalComponent))
