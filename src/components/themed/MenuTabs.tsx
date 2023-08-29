import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Foundation from 'react-native-vector-icons/Foundation'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index'
import { useHandler } from '../../hooks/useHandler'
import { LocaleStringKey } from '../../locales/en_US'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from './DividerLine'
import { EdgeText } from './EdgeText'
import { VectorIcon } from './VectorIcon'

const extraTabString: LocaleStringKey = config.extraTab?.tabTitleKey ?? 'title_map'

const title: { readonly [key: string]: string } = {
  marketsTab: lstrings.title_markets,
  walletsTab: lstrings.title_wallets,
  buyTab: lstrings.title_buy,
  sellTab: lstrings.title_sell,
  exchangeTab: lstrings.title_exchange,
  extraTab: lstrings[extraTabString]
}

export const MenuTabs = (props: BottomTabBarProps) => {
  const { navigation, state } = props
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const activeTabIndex = state.index
  const colors = theme.tabBarBackground
  const start = theme.tabBarBackgroundStart
  const end = theme.tabBarBackgroundEnd
  const routes = state.routes

  const handleOnPress = useHandler((route: string) => {
    const currentName = routes[activeTabIndex].name
    switch (route) {
      case 'walletsTab':
        return navigation.navigate('walletsTab', currentName === 'walletsTab' ? { screen: 'walletList' } : {})
      case 'buyTab':
        return navigation.navigate('buyTab', currentName === 'buyTab' ? { screen: 'pluginListBuy' } : {})
      case 'sellTab':
        return navigation.navigate('sellTab', currentName === 'sellTab' ? { screen: 'pluginListSell' } : {})
      case 'exchangeTab':
        return navigation.navigate('exchangeTab', currentName === 'exchangeTab' ? { screen: 'exchange' } : {})
      case 'marketsTab':
        return navigation.navigate('marketsTab', currentName === 'marketsTab' ? { screen: 'coinRanking' } : {})
      case 'extraTab':
        return navigation.navigate('extraTab')
    }
  })

  if (config.extraTab == null) {
    const index = routes.findIndex(route => route.name === 'extraTab')
    routes.splice(index, 1)
  }

  if (config.disableSwaps === true) {
    const index = routes.findIndex(route => route.name === 'exchangeTab')
    routes.splice(index, 1)
  }

  const contentStyle = React.useMemo(() => {
    const paddingBottom = insets.bottom === 0 ? theme.rem(0.75) : insets.bottom
    return [styles.content, { paddingBottom }]
  }, [insets.bottom, styles.content, theme])

  return (
    <View>
      <DividerLine colors={theme.tabBarTopOutlineColors} />
      <LinearGradient colors={colors} start={start} end={end} style={styles.container}>
        {routes.map((route, index: number) => {
          const color = activeTabIndex === index ? theme.tabBarIconHighlighted : theme.tabBarIcon
          const icon: { readonly [key: string]: JSX.Element } = {
            marketsTab: <Foundation name="list-number" size={theme.rem(1.25)} color={color} />,
            walletsTab: <Fontello name="wallet-1" size={theme.rem(1.25)} color={color} />,
            buyTab: <Fontello name="buy" size={theme.rem(1.25)} color={color} />,
            sellTab: <Fontello name="sell" size={theme.rem(1.25)} color={color} />,
            exchangeTab: <Ionicon name="swap-horizontal" size={theme.rem(1.25)} color={color} />,
            extraTab: <VectorIcon font="Feather" name="map-pin" size={theme.rem(1.25)} color={color} />
          }
          return (
            <TouchableOpacity accessible={false} style={contentStyle} key={route.key} onPress={() => handleOnPress(route.name)}>
              {icon[route.name]}
              <EdgeText accessible style={{ ...styles.text, color: color }}>
                {title[route.name]}
              </EdgeText>
            </TouchableOpacity>
          )
        })}
      </LinearGradient>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1,
    paddingTop: theme.rem(0.75),
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(2 / 16)
  }
}))
