// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import s from '../../../locales/strings'
import FormattedText from '../../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { getDisplayDenominationFull, getPrimaryExchangeDenomination } from '../../../selectors/DenominationSelectors.js'
import { getExchangeRate, getSelectedWallet } from '../../../selectors/WalletSelectors.js'
import { useSelector } from '../../../types/reactRedux.js'
import { emptyGuiDenomination } from '../../../types/types.js'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getDenomFromIsoCode, zeroString } from '../../../util/utils.js'
import { ExchangeRate } from '../../common/ExchangeRate.js'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext'

export function ControlPanelRateComponent() {
  const theme = useTheme()
  const styles = getStyles(theme)
  const {
    exchangeRate,
    currencyLogo,
    primaryDisplayCurrencyCode,
    primaryDisplayDenomination,
    primaryExchangeDenomination,
    secondaryDisplayCurrencyCode,
    secondaryToPrimaryRatio
  } = useSelector(state => {
    const guiWallet = getSelectedWallet(state)
    const currencyCode = state.ui.wallets.selectedCurrencyCode

    if (guiWallet == null || currencyCode == null) {
      return {
        currencyLogo: '',
        exchangeRate: '0',
        primaryDisplayCurrencyCode: '',
        primaryDisplayDenomination: '',
        primaryExchangeDenomination: '',
        secondaryDisplayCurrencyCode: '',
        secondaryToPrimaryRatio: '0',
        username: state.core.account.username
      }
    }

    return {
      exchangeRate: getExchangeRate(state, currencyCode, guiWallet.isoFiatCurrencyCode),
      isoFiatCurrencyCode: guiWallet.isoFiatCurrencyCode,
      currencyLogo: getCurrencyIcon(guiWallet.currencyCode, currencyCode).symbolImage,
      secondaryDisplayCurrencyCode: guiWallet.fiatCurrencyCode,
      secondaryToPrimaryRatio: getExchangeRate(state, currencyCode, guiWallet.isoFiatCurrencyCode),
      primaryDisplayCurrencyCode: currencyCode,
      primaryDisplayDenomination: getDisplayDenominationFull(state, currencyCode),
      primaryExchangeDenomination: getPrimaryExchangeDenomination(state, currencyCode),
      username: state.core.account.username
    }
  })

  const secondaryExchangeDenomination = secondaryDisplayCurrencyCode ? getDenomFromIsoCode(secondaryDisplayCurrencyCode) : ''

  const primaryCurrencyInfo = {
    displayCurrencyCode: primaryDisplayCurrencyCode,
    displayDenomination: primaryDisplayDenomination || emptyGuiDenomination,
    exchangeDenomination: primaryExchangeDenomination || emptyGuiDenomination,
    exchangeCurrencyCode: primaryDisplayCurrencyCode
  }
  const secondaryCurrencyInfo = {
    displayCurrencyCode: secondaryDisplayCurrencyCode,
    displayDenomination: secondaryExchangeDenomination || emptyGuiDenomination,
    exchangeDenomination: secondaryExchangeDenomination || emptyGuiDenomination,
    exchangeCurrencyCode: secondaryDisplayCurrencyCode
  }

  return (
    <View style={styles.container}>
      {!!currencyLogo && <Image style={styles.image} source={{ uri: currencyLogo }} />}
      {!zeroString(exchangeRate) ? (
        <ExchangeRate
          primaryInfo={primaryCurrencyInfo}
          secondaryInfo={secondaryCurrencyInfo}
          secondaryDisplayAmount={secondaryToPrimaryRatio}
          style={styles.exchangeRateText}
        />
      ) : (
        <FormattedText style={styles.exchangeRateText}>{s.strings.exchange_rate_loading_singular}</FormattedText>
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    display: 'flex',
    alignSelf: 'stretch',
    marginTop: theme.rem(1.5),
    marginBottom: theme.rem(1.5),
    marginLeft: theme.rem(0.5),
    alignItems: 'center'
  },
  image: {
    width: theme.rem(1.5),
    height: theme.rem(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1),
    marginLeft: theme.rem(-0.25)
  },
  exchangeRateText: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceMedium,
    color: theme.primaryText,
    marginLeft: theme.rem(0.5)
  }
}))
