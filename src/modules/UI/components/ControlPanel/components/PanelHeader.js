// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import { ExchangeRate } from '../../../../../components/common/ExchangeRate.js'
import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import s from '../../../../../locales/strings'
import FormattedText from '../../FormattedText/FormattedText.ui.js'

export type Props = {
  currencyLogo: string,
  exchangeRate: number,
  currencyLogo: string,
  exchangeRate: any,
  selectedCurrencyCode: string,
  primaryDisplayDenomination: string,
  primaryExchangeDenomination: any,
  fiatCurrencyCode: string,
  secondaryExchangeDenomination: any
}

function PanelHeader(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const {
    currencyLogo,
    exchangeRate,
    selectedCurrencyCode,
    primaryDisplayDenomination,
    primaryExchangeDenomination,
    fiatCurrencyCode,
    secondaryExchangeDenomination
  } = props

  const currencyLogoIcon = { uri: currencyLogo }

  const primaryCurrencyInfo = {
    displayCurrencyCode: selectedCurrencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination,
    exchangeCurrencyCode: selectedCurrencyCode
  }

  const secondaryCurrencyInfo = {
    displayCurrencyCode: fiatCurrencyCode,
    displayDenomination: secondaryExchangeDenomination,
    exchangeDenomination: secondaryExchangeDenomination,
    exchangeCurrencyCode: fiatCurrencyCode
  }

  return (
    <View style={styles.header}>
      {!!currencyLogo && <Image style={styles.iconImage} source={currencyLogoIcon} />}
      <View style={styles.exchangeContainer}>
        {exchangeRate ? (
          <ExchangeRate primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={exchangeRate} />
        ) : (
          <FormattedText style={styles.exchangeRateText}>{s.strings.exchange_rate_loading_singular}</FormattedText>
        )}
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    height: theme.rem(3),
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: theme.rem(1)
  },
  iconImage: {
    width: theme.rem(1.5),
    height: theme.rem(1.5)
  },
  exchangeContainer: {
    paddingHorizontal: theme.rem(1.5)
  },
  exchangeRateText: {
    fontSize: theme.rem(1)
  }
}))

export default PanelHeader
