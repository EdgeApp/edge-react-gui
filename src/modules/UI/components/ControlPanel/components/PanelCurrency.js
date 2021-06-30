// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import { ExchangeRate } from '../../../../../components/common/ExchangeRate.js'
import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import s from '../../../../../locales/strings'
import { type RootState } from '../../../../../reducers/RootReducer.js'
import { type GuiDenomination, emptyGuiDenomination } from '../../../../../types/types.js'
import { getCurrencyIcon } from '../../../../../util/CurrencyInfoHelpers.js'
import { useSelector } from '../../../../../util/hooks'
import { getDenomFromIsoCode, reduxShallowEqual } from '../../../../../util/utils.js'
import { getDisplayDenominationFull } from '../../../../Settings/selectors.js'
import { getExchangeDenomination, getExchangeRate, getSelectedWallet } from '../../../../UI/selectors.js'
import FormattedText from '../../FormattedText/FormattedText.ui.js'

export type StateProps = {
  currencyCode: string,
  fiatCurrencyCode: string,
  selectedCurrencyCode: string,
  exchangeRate: number,
  primaryDisplayDenomination: GuiDenomination,
  primaryExchangeDenomination: GuiDenomination
}

const selector = (state: RootState): StateProps => {
  const guiWallet = getSelectedWallet(state)
  const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode

  return {
    currencyCode: guiWallet ? guiWallet.currencyCode : '',
    fiatCurrencyCode: guiWallet ? guiWallet.fiatCurrencyCode : '',
    selectedCurrencyCode,
    exchangeRate: guiWallet ? getExchangeRate(state, selectedCurrencyCode, guiWallet.isoFiatCurrencyCode) : 0,
    primaryDisplayDenomination: guiWallet ? getDisplayDenominationFull(state, selectedCurrencyCode) : emptyGuiDenomination,
    primaryExchangeDenomination: guiWallet ? getExchangeDenomination(state, selectedCurrencyCode) : emptyGuiDenomination
  }
}

function PanelCurrency() {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { currencyCode, fiatCurrencyCode, selectedCurrencyCode, exchangeRate, primaryDisplayDenomination, primaryExchangeDenomination }: StateProps =
    useSelector(selector, reduxShallowEqual)

  const currencyLogo = getCurrencyIcon(currencyCode, selectedCurrencyCode).symbolImage

  const secondaryExchangeDenomination = getDenomFromIsoCode(fiatCurrencyCode)

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
    <View style={styles.currency}>
      {!!currencyLogo && <Image style={styles.image} source={{ uri: currencyLogo }} />}
      <View>
        {exchangeRate ? (
          <ExchangeRate style={styles.text} primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={exchangeRate} />
        ) : (
          <FormattedText style={styles.exchangeRateText}>{s.strings.exchange_rate_loading_singular}</FormattedText>
        )}
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  currency: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    display: 'flex',
    alignSelf: 'stretch',
    marginTop: theme.rem(1.5),
    marginBottom: theme.rem(1.5)
  },
  image: {
    width: theme.rem(1.5),
    height: theme.rem(1.5),
    marginRight: theme.rem(1.5)
  },
  text: {
    fontFamily: theme.fontFaceBold,
    textTransform: 'uppercase'
  },
  exchangeRateText: {
    fontSize: theme.rem(1)
  }
}))

export default PanelCurrency
