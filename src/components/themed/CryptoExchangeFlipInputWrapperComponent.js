// @flow

import * as React from 'react'
import { ActivityIndicator, Image, View } from 'react-native'

import type { GuiCurrencyInfo, GuiWallet } from '../../types/types.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Card } from './Card'
import { EdgeText } from './EdgeText'
import type { ExchangedFlipInputAmounts } from './ExchangedFlipInput'
import { ExchangedFlipInput } from './ExchangedFlipInput.js'
import { PrimaryButton } from './PrimaryButton.js'
import { SelectableRow } from './SelectableRow'

export type Props = {
  guiWallet: GuiWallet,
  buttonText: string,
  currencyLogo: string,
  headerText: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  fiatPerCrypto: number,
  forceUpdateGuiCounter: number,
  overridePrimaryExchangeAmount: string,
  isFocused: boolean,
  isThinking?: boolean,
  focusMe(): void,
  launchWalletSelector: () => void,
  onCryptoExchangeAmountChanged: ExchangedFlipInputAmounts => void,
  onNext: () => void,
  onFocus?: () => void,
  onBlur?: () => void
}

class CryptoExchangeFlipInputWrapperComponent extends React.Component<Props & ThemeProps> {
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

  render() {
    const { onNext, primaryCurrencyInfo, secondaryCurrencyInfo, fiatPerCrypto, forceUpdateGuiCounter, overridePrimaryExchangeAmount, theme } = this.props
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
      return <PrimaryButton label={this.props.buttonText} outlined onPress={this.launchSelector} />
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
      </Card>
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
    fontWeight: '600',
    fontSize: theme.rem(1.25)
  }
}))

export const CryptoExchangeFlipInputWrapper = withTheme(CryptoExchangeFlipInputWrapperComponent)
