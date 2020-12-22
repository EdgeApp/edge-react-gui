// @flow

import * as React from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'

import { ArrowDownTextIconButton } from '../../../../components/common/ArrowDownTextIconButton.js'
import { B } from '../../../../styles/common/textStyles.js'
import { THEME } from '../../../../theme/variables/airbitz.js'
import type { GuiCurrencyInfo, GuiWallet } from '../../../../types/types.js'
import { scale } from '../../../../util/scaling.js'
import type { ExchangedFlipInputAmounts } from './ExchangedFlipInput2.js'
import { ExchangedFlipInput } from './ExchangedFlipInput2.js'

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
  onNext: () => void
}

export class CryptoExchangeFlipInputWrapperComponent extends React.Component<Props> {
  launchSelector = () => {
    this.props.launchWalletSelector()
  }

  onExchangeAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    this.props.onCryptoExchangeAmountChanged(amounts)
  }

  renderLogo = (logo: string) => {
    return (
      <View style={styles.iconContainer}>
        <Image style={styles.currencyIcon} source={{ uri: logo || '' }} />
      </View>
    )
  }

  render() {
    const { onNext, primaryCurrencyInfo, secondaryCurrencyInfo, fiatPerCrypto, forceUpdateGuiCounter, overridePrimaryExchangeAmount } = this.props

    if (this.props.isThinking) {
      return (
        <View style={[styles.containerNoFee, styles.containerNoWalletSelected]}>
          <View style={styles.topRow}>
            <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
          </View>
        </View>
      )
    }

    if (!this.props.guiWallet || this.props.guiWallet.id === '' || !primaryCurrencyInfo || !secondaryCurrencyInfo) {
      return (
        <View style={[styles.containerNoFee, styles.containerNoWalletSelected]}>
          <View style={styles.topRow}>
            <ArrowDownTextIconButton onPress={this.launchSelector} title={this.props.buttonText} />
          </View>
        </View>
      )
    }
    const guiWalletName = this.props.guiWallet.name
    const displayDenomination = this.props.primaryCurrencyInfo.displayCurrencyCode

    if (!this.props.isFocused) {
      return (
        <View style={styles.containerSelectedWalletNotFocus}>
          {this.renderLogo(this.props.currencyLogo)}
          <View style={styles.topRow}>
            <ArrowDownTextIconButton
              onPress={this.props.focusMe}
              title={
                <Text style={styles.iconText} ellipsizeMode="middle" numberOfLines={1}>
                  {guiWalletName + ':'}
                  <B> {displayDenomination}</B>
                </Text>
              }
            />
          </View>
        </View>
      )
    }

    return (
      <ExchangedFlipInput
        onNext={onNext}
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
    )
  }
}

const rawStyles = {
  containerNoFee: {
    width: '90%',
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    borderRadius: 3
  },
  containerNoWalletSelected: {
    paddingVertical: scale(10),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  containerSelectedWalletNotFocus: {
    width: '90%',
    paddingVertical: scale(10),
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  topRow: {
    height: scale(34),
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  iconContainer: {
    height: scale(29),
    width: scale(29),
    backgroundColor: THEME.COLORS.TRANSPARENT,
    borderRadius: 15,
    marginRight: scale(8),
    marginLeft: scale(12)
  },
  currencyIcon: {
    height: scale(25),
    width: scale(25),
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
    color: THEME.COLORS.WHITE,
    fontSize: scale(20)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
