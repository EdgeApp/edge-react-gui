// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import edgeLogo from '../../../../../assets/images/edgeLogo/Edge_logo_Icon.png'
import { ExchangeRate } from '../../../../../components/common/ExchangeRate.js'
import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import { EdgeText } from '../../../../../components/themed/EdgeText'
import s from '../../../../../locales/strings'
import type { GuiDenomination } from '../../../../types/types.js'
import FormattedText from '../../FormattedText/FormattedText.ui.js'

export type Props = {
  currencyLogo: string,
  exchangeRate: number,
  currencyLogo: string,
  exchangeRate: number,
  selectedCurrencyCode: string,
  primaryDisplayDenomination: string,
  primaryExchangeDenomination: GuiDenomination,
  fiatCurrencyCode: string,
  secondaryExchangeDenomination: GuiDenomination
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
      <View style={styles.logo}>
        <Image style={styles.logoImage} source={edgeLogo} resizeMode="contain" />
        <EdgeText style={styles.logoText}>{s.strings.app_name_short}</EdgeText>
      </View>
      <View style={styles.currency}>
        {!!currencyLogo && <Image style={styles.currencyImage} source={currencyLogoIcon} />}
        <View>
          {exchangeRate ? (
            <ExchangeRate
              style={styles.currencyText}
              primaryInfo={primaryCurrencyInfo}
              secondaryInfo={secondaryCurrencyInfo}
              secondaryDisplayAmount={exchangeRate}
            />
          ) : (
            <FormattedText style={styles.exchangeRateText}>{s.strings.exchange_rate_loading_singular}</FormattedText>
          )}
        </View>
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  logo: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.rem(2),
    marginRight: theme.rem(1)
  },
  logoText: {
    fontSize: theme.rem(2),
    fontFamily: theme.fontFaceBold,
    textTransform: 'lowercase'
  },
  logoImage: {
    width: theme.rem(1.5),
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(0.25)
  },
  currency: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    display: 'flex',
    alignSelf: 'stretch',
    marginTop: theme.rem(1.5),
    marginBottom: theme.rem(1.5)
  },
  currencyImage: {
    width: theme.rem(1.5),
    height: theme.rem(1.5),
    marginRight: theme.rem(1.5)
  },
  currencyText: {
    fontFamily: theme.fontFaceBold,
    textTransform: 'uppercase'
  },
  exchangeRateText: {
    fontSize: theme.rem(1)
  }
}))

export default PanelHeader
