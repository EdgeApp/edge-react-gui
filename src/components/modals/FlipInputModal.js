// @flow

import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { MenuProvider } from 'react-native-popup-menu'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../modules/Settings/selectors.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { ExchangedFlipInput } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import { convertCurrencyFromExchangeRates, convertNativeToExchangeRateDenomination, getExchangeRate } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { GuiCurrencyInfo } from '../../types/types.js'
import { getDenomFromIsoCode } from '../../util/utils.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<void>,
  walletId: string,
  currencyCode: string
}

type StateProps = {
  balanceCrypto: string,
  balanceFiat: string,

  // FlipInput
  flipInputHeaderText: string,
  flipInputHeaderLogo: string,
  primaryInfo: GuiCurrencyInfo,
  secondaryInfo: GuiCurrencyInfo,
  fiatPerCrypto: number
}

type Props = OwnProps & StateProps & ThemeProps

class FlipInputModalComponent extends React.PureComponent<Props> {
  handleCloseModal = () => this.props.bridge.resolve()

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
    const styles = getStyles(theme)
    return (
      <View style={styles.flipInputContainer}>
        <ExchangedFlipInput
          headerText={flipInputHeaderText}
          headerLogo={flipInputHeaderLogo}
          primaryCurrencyInfo={{ ...primaryInfo }}
          secondaryCurrencyInfo={{ ...secondaryInfo }}
          exchangeSecondaryToPrimaryRatio={fiatPerCrypto}
          overridePrimaryExchangeAmount=""
          forceUpdateGuiCounter={0}
          onExchangeAmountChanged={this.handleExchangeAmountChange}
          onNext={this.handleCloseModal}
          keyboardVisible={false}
          isFocus
          isFiatOnTop
        />
      </View>
    )
  }

  handleExchangeAmountChange = ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {}

  render() {
    return (
      <MenuProvider style={{ flexDirection: 'row' }}>
        <ThemedModal bridge={this.props.bridge} onCancel={this.handleCloseModal}>
          <ModalTitle>{s.strings.string_enter_amount}</ModalTitle>
          {this.renderBalance()}
          {this.renderFlipInput()}
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
  }
}))

export const FlipInputModal = connect((state: RootState, ownProps: OwnProps): StateProps => {
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

  return {
    // Balances
    balanceCrypto: `${balanceCrypto} ${currencyCode}`,
    balanceFiat: `${fiatDenomination.symbol ? fiatDenomination.symbol + ' ' : ''} ${balanceFiat.toFixed(2)}`,

    // FlipInput
    flipInputHeaderText: sprintf(s.strings.send_from_wallet, guiWallet.name),
    flipInputHeaderLogo: guiWallet.symbolImageDarkMono || '',
    primaryInfo,
    secondaryInfo,
    fiatPerCrypto: fiatPerCrypto || 0
  }
})(withTheme(FlipInputModalComponent))
