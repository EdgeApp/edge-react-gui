// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import edgeLogo from '../../../../../assets/images/edgeLogo/Edge_logo_Icon.png'
import { ExchangeRate } from '../../../../../components/common/ExchangeRate.js'
import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import { EdgeText } from '../../../../../components/themed/EdgeText'
import Separator from '../../../../../components/themed/Separator'
import s from '../../../../../locales/strings'
import type { GuiDenomination } from '../../../../types/types.js'
import FormattedText from '../../FormattedText/FormattedText.ui.js'
import AccountList from './AccountList'
import UserList from './UserListConnector'

export type Props = {
  username: string,
  isViewUserList: boolean,
  currencyLogo: string,
  exchangeRate: number,
  currencyLogo: string,
  exchangeRate: number,
  selectedCurrencyCode: string,
  primaryDisplayDenomination: string,
  primaryExchangeDenomination: GuiDenomination,
  fiatCurrencyCode: string,
  secondaryExchangeDenomination: GuiDenomination,
  toggleUserList: () => void
}

function PanelHeader(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const {
    username,
    isViewUserList,
    currencyLogo,
    exchangeRate,
    selectedCurrencyCode,
    primaryDisplayDenomination,
    primaryExchangeDenomination,
    fiatCurrencyCode,
    secondaryExchangeDenomination,
    toggleUserList
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
      <AccountList onPress={toggleUserList} username={username} usersView={isViewUserList} />
      <Separator style={styles.separator} />
      <UserList />
      {isViewUserList ? (
        <View style={styles.accountContainer}>
          <EdgeText>User 1</EdgeText>
          <EdgeText>User 2</EdgeText>
          <EdgeText>User 3</EdgeText>
        </View>
      ) : null}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    borderBottomRightRadius: theme.rem(2),
    borderBottomLeftRadius: theme.rem(2),
    paddingHorizontal: theme.rem(1),
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.panelBackground,
    zIndex: 2
  },
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
  },
  accountContainer: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: theme.rem(1)
  },
  separator: {
    marginBottom: theme.rem(0.5),
    marginTop: theme.rem(1),
    marginRight: theme.rem(-1)
  }
}))

export default PanelHeader
