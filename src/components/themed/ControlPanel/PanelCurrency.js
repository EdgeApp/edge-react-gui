// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import s from '../../../locales/strings'
import FormattedText from '../../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type RootState } from '../../../reducers/RootReducer.js'
import { getDisplayDenominationFull, getPrimaryExchangeDenomination } from '../../../selectors/DenominationSelectors.js'
import { getExchangeRate, getSelectedWallet } from '../../../selectors/WalletSelectors.js'
import { reduxShallowEqual, useSelector } from '../../../types/reactRedux.js'
import { type GuiDenomination, emptyGuiDenomination } from '../../../types/types.js'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers.js'
import { getDenomFromIsoCode, zeroString } from '../../../util/utils.js'
import { ExchangeRate } from '../../common/ExchangeRate.js'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext'

export type StateProps = {
  currencyLogo: string,
  exchangeRate: string,
  primaryDisplayCurrencyCode: string,
  primaryDisplayDenomination?: GuiDenomination,
  primaryExchangeDenomination?: GuiDenomination,
  secondaryDisplayCurrencyCode: string,
  secondaryToPrimaryRatio: string,
  username: string,
  usersView: boolean
}

const selector = (state: RootState): StateProps => {
  const guiWallet = getSelectedWallet(state)
  const currencyCode = state.ui.wallets.selectedCurrencyCode

  if (guiWallet == null || currencyCode == null) {
    return {
      currencyLogo: '',
      exchangeRate: '0',
      primaryDisplayCurrencyCode: '',
      secondaryDisplayCurrencyCode: '',
      secondaryToPrimaryRatio: '0',
      username: state.core.account.username,
      usersView: state.ui.scenes.controlPanel.usersView
    }
  }

  return {
    exchangeRate: getExchangeRate(state, currencyCode, guiWallet.isoFiatCurrencyCode),
    isoFiatCurrencyCode: guiWallet.isoFiatCurrencyCode,
    // if selected currencyCode is parent wallet currencyCode
    currencyLogo: getCurrencyIcon(guiWallet.currencyCode, currencyCode).symbolImage,
    secondaryDisplayCurrencyCode: guiWallet.fiatCurrencyCode,
    secondaryToPrimaryRatio: getExchangeRate(state, currencyCode, guiWallet.isoFiatCurrencyCode),
    primaryDisplayCurrencyCode: currencyCode,
    primaryDisplayDenomination: getDisplayDenominationFull(state, currencyCode),
    primaryExchangeDenomination: getPrimaryExchangeDenomination(state, currencyCode),
    username: state.core.account.username,
    usersView: state.ui.scenes.controlPanel.usersView
  }
}

export function PanelCurrency() {
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
  }: StateProps = useSelector(selector, reduxShallowEqual)

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
  const currencyLogoIcon = { uri: currencyLogo }

  return (
    <View style={styles.currency}>
      {!!currencyLogo && <Image style={styles.image} source={currencyLogoIcon} />}
      <View>
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
    marginBottom: theme.rem(1.5),
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
  text: {
    fontFamily: theme.fontFaceBold,
    textTransform: 'uppercase'
  },
  exchangeRateText: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceBold,
    color: theme.primaryText
  }
}))

export default PanelCurrency
