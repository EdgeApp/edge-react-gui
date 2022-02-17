// @flow

import { add } from 'biggystring'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import type { GuiCurrencyInfo } from '../../types/types.js'
import { convertNativeToDenomination } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Card } from './Card'
import { EdgeText } from './EdgeText'
import type { ExchangedFlipInputAmounts } from './ExchangedFlipInput'
import { ExchangedFlipInput } from './ExchangedFlipInput.js'
import { MainButton } from './MainButton.js'
import { SelectableRow } from './SelectableRow'

type OwnProps = {
  walletId: string,
  buttonText: string,
  currencyLogo: string,
  headerText: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  fiatPerCrypto: string,
  forceUpdateGuiCounter: number,
  overridePrimaryExchangeAmount: string,
  isFocused: boolean,
  isThinking?: boolean,
  focusMe: () => void,
  launchWalletSelector: () => void,
  onCryptoExchangeAmountChanged: ExchangedFlipInputAmounts => void,
  onNext: () => void,
  onFocus?: () => void,
  onBlur?: () => void,
  children?: React.Node
}

type StateProps = {
  name?: string,
  cryptoAmount?: string
}

type State = {
  errorMessage?: string
}

type Props = OwnProps & StateProps & ThemeProps

class CryptoExchangeFlipInputWrapperComponent extends React.Component<Props, State> {
  onExchangeAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.props.onCryptoExchangeAmountChanged(amounts)
  }

  renderLogo = (logo: string) => {
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.iconContainer}>
        <FastImage style={styles.currencyIcon} source={{ uri: logo || '' }} />
      </View>
    )
  }

  renderBalance = () => {
    const { cryptoAmount, primaryCurrencyInfo } = this.props
    const styles = getStyles(this.props.theme)

    if (cryptoAmount == null) {
      return null
    }

    return (
      <EdgeText style={styles.balanceText}>
        {s.strings.string_wallet_balance + ': ' + cryptoAmount + ' ' + primaryCurrencyInfo.displayDenomination.name}
      </EdgeText>
    )
  }

  onError = (errorMessage?: string) => this.setState({ errorMessage })

  clearError = () => this.onError()

  launchSelector = () => {
    this.clearError()
    this.props.launchWalletSelector()
  }

  focusMe = () => {
    this.clearError()
    this.props.focusMe()
  }

  render() {
    const { onNext, primaryCurrencyInfo, secondaryCurrencyInfo, fiatPerCrypto, forceUpdateGuiCounter, name, overridePrimaryExchangeAmount, children, theme } =
      this.props
    const styles = getStyles(theme)

    if (this.props.isThinking) {
      return (
        <View style={[styles.container, styles.containerNoFee, styles.containerNoWalletSelected]}>
          <View style={styles.topRow}>
            <ActivityIndicator color={theme.iconTappable} />
          </View>
        </View>
      )
    }

    if (this.props.walletId === '' || primaryCurrencyInfo == null || secondaryCurrencyInfo == null) {
      return <MainButton label={this.props.buttonText} type="secondary" onPress={this.launchSelector} />
    }
    const guiWalletName = name ?? ''
    const displayDenomination = this.props.primaryCurrencyInfo.displayCurrencyCode

    if (!this.props.isFocused) {
      return (
        <Card paddingRem={0}>
          <View style={styles.containerSelectedWalletNotFocus}>
            <SelectableRow
              autoWidth
              arrowTappable
              onPress={this.focusMe}
              icon={this.renderLogo(this.props.currencyLogo)}
              title={
                <EdgeText style={styles.iconText} numberOfLines={1}>
                  {guiWalletName + ': ' + displayDenomination}
                </EdgeText>
              }
            />
          </View>
        </Card>
      )
    }

    return (
      <>
        {this.state?.errorMessage != null ? <EdgeText style={styles.errorText}>{this.state.errorMessage ?? ''}</EdgeText> : null}
        {this.renderBalance()}
        <Card>
          <ExchangedFlipInput
            onNext={onNext}
            onFocus={this.props.onFocus}
            onBlur={this.props.onBlur}
            headerText={this.props.headerText}
            headerLogo={this.props.currencyLogo}
            headerCallback={this.launchSelector}
            primaryCurrencyInfo={primaryCurrencyInfo}
            secondaryCurrencyInfo={secondaryCurrencyInfo}
            exchangeSecondaryToPrimaryRatio={fiatPerCrypto}
            overridePrimaryExchangeAmount={overridePrimaryExchangeAmount}
            forceUpdateGuiCounter={forceUpdateGuiCounter}
            onExchangeAmountChanged={this.onExchangeAmountChanged}
            onError={this.onError}
            keyboardVisible={false}
            isFiatOnTop
            isFocus={false}
          />
          {children}
        </Card>
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    width: '100%'
  },
  containerNoFee: {
    backgroundColor: theme.tileBackground,
    borderRadius: 3
  },
  containerNoWalletSelected: {
    paddingVertical: theme.rem(0.75),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  containerSelectedWalletNotFocus: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  topRow: {
    height: theme.rem(2),
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  iconContainer: {
    top: theme.rem(0.125),
    height: theme.rem(1.75),
    width: theme.rem(1.75),
    borderRadius: theme.rem(1)
  },
  currencyIcon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    resizeMode: 'contain'
  },
  textIconContainer: {
    position: 'relative',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(1.25)
  },
  balanceText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(1),
    marginBottom: theme.rem(0.5),
    color: theme.secondaryText
  },
  errorText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(1),
    marginBottom: theme.rem(0.75),
    color: theme.dangerText
  }
}))

export const CryptoExchangeFlipInputWrapper = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { currencyWallets } = state.core.account
    const wallet = currencyWallets[ownProps.walletId]
    if (wallet == null) return {}

    const { balances, name } = wallet

    const { displayCurrencyCode, displayDenomination } = ownProps.primaryCurrencyInfo
    const balance = balances?.[displayCurrencyCode] ?? '0'
    const cryptoAmountRaw: string = convertNativeToDenomination(displayDenomination.multiplier)(balance)
    const cryptoAmount = formatNumber(add(cryptoAmountRaw, '0'))

    return { name: name ?? '', cryptoAmount: cryptoAmount }
  },
  dispatch => ({})
)(withTheme(CryptoExchangeFlipInputWrapperComponent))
