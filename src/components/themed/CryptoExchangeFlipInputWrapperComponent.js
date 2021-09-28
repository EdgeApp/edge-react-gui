// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { ActivityIndicator, Image, View } from 'react-native'

import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import type { GuiCurrencyInfo, GuiWallet } from '../../types/types.js'
import { convertNativeToDenomination } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Card } from './Card'
import { EdgeText } from './EdgeText'
import type { ExchangedFlipInputAmounts } from './ExchangedFlipInput'
import { ExchangedFlipInput } from './ExchangedFlipInput.js'
import { MainButton } from './MainButton.js'
import { SelectableRow } from './SelectableRow'

type OwnProps = {
  guiWallet: GuiWallet,
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
  cryptoAmount?: string
}

type Props = OwnProps & StateProps & ThemeProps

class CryptoExchangeFlipInputWrapperComponent extends React.Component<Props> {
  launchSelector = () => {
    this.props.launchWalletSelector()
  }

  onExchangeAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.props.onCryptoExchangeAmountChanged(amounts)
  }

  renderLogo = (logo: string) => {
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.iconContainer}>
        <Image style={styles.currencyIcon} source={{ uri: logo || '' }} />
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

  render() {
    const { onNext, primaryCurrencyInfo, secondaryCurrencyInfo, fiatPerCrypto, forceUpdateGuiCounter, overridePrimaryExchangeAmount, children, theme } =
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

    if (!this.props.guiWallet || this.props.guiWallet.id === '' || !primaryCurrencyInfo || !secondaryCurrencyInfo) {
      return <MainButton label={this.props.buttonText} type="secondary" onPress={this.launchSelector} />
    }
    const guiWalletName = this.props.guiWallet.name
    const displayDenomination = this.props.primaryCurrencyInfo.displayCurrencyCode

    if (!this.props.isFocused) {
      return (
        <Card paddingRem={0}>
          <View style={styles.containerSelectedWalletNotFocus}>
            <SelectableRow
              autoWidth
              arrowTappable
              onPress={this.props.focusMe}
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
  }
}))

export const CryptoExchangeFlipInputWrapper = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { displayCurrencyCode, displayDenomination } = ownProps.primaryCurrencyInfo
    const balance = ownProps.guiWallet.nativeBalances[displayCurrencyCode]

    if (balance != null) {
      const cryptoAmountRaw: string = convertNativeToDenomination(displayDenomination.multiplier)(balance)
      const cryptoAmount = intl.formatNumber(bns.add(cryptoAmountRaw, '0'))

      return { cryptoAmount }
    }

    return {}
  },
  dispatch => ({})
)(withTheme(CryptoExchangeFlipInputWrapperComponent))
