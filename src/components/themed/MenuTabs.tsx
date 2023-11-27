import { BottomTabBarProps, BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs'
import { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import * as React from 'react'
import { useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Foundation from 'react-native-vector-icons/Foundation'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index'
import { useHandler } from '../../hooks/useHandler'
import { LocaleStringKey } from '../../locales/en_US'
import { lstrings } from '../../locales/strings'
import { useDrawerOpenRatio } from '../../state/SceneDrawerState'
import { config } from '../../theme/appConfig'
import { styled } from '../hoc/styled'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from './DividerLine'
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
  const activeTabFullIndex = state.index
  const colors = theme.tabBarBackground
  const start = theme.tabBarBackgroundStart
  const end = theme.tabBarBackgroundEnd
  const routes = useMemo(
    () =>
      state.routes.filter(route => {
        if (config.extraTab == null && route.name === 'extraTab') {
          return false
        }
        if (config.disableSwaps === true && route.name === 'exchangeTab') {
          return false
        }
        return true
      }),
    [state.routes]
  )

  const activeTabRoute = state.routes[activeTabFullIndex]
  const activeTabIndex = routes.findIndex(route => route.name === activeTabRoute.name)

  const { drawerOpenRatio, isRatioDisabled = false, resetDrawerRatio } = useDrawerOpenRatio()

  return (
    <Container>
      <DividerLine colors={theme.tabBarTopOutlineColors} />
      <LinearGradient colors={colors} start={start} end={end}>
        <Tabs>
          {routes.map((route, index: number) => (
            <Tab
              currentName={routes[activeTabIndex].name}
              navigation={navigation}
              key={route.name}
              route={route}
              isActive={activeTabIndex === index}
              drawerOpenRatio={drawerOpenRatio}
              resetDrawerRatio={resetDrawerRatio}
              isRatioDisabled={isRatioDisabled}
            />
          ))}
        </Tabs>
      </LinearGradient>
    </Container>
  )
}

const Tab = ({
  route,
  isActive,
  drawerOpenRatio,
  resetDrawerRatio,
  currentName,
  isRatioDisabled,
  navigation
}: {
  isActive: boolean
  currentName: string
  route: BottomTabBarProps['state']['routes'][number]
  drawerOpenRatio: SharedValue<number> | undefined
  resetDrawerRatio: () => void
  isRatioDisabled: boolean
  navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>
}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const color = isActive ? theme.tabBarIconHighlighted : theme.tabBarIcon

  const contentStyle = React.useMemo(() => {
    const paddingBottom = insets.bottom === 0 ? theme.rem(0.75) : insets.bottom
    return [styles.content, { paddingBottom }]
  }, [insets.bottom, styles.content, theme])

  const icon: { readonly [key: string]: JSX.Element } = {
    marketsTab: <Foundation name="list-number" size={theme.rem(1.25)} color={color} />,
    walletsTab: <Fontello name="wallet-1" size={theme.rem(1.25)} color={color} />,
    buyTab: <Fontello name="buy" size={theme.rem(1.25)} color={color} />,
    sellTab: <Fontello name="sell" size={theme.rem(1.25)} color={color} />,
    exchangeTab: <Ionicon name="swap-horizontal" size={theme.rem(1.25)} color={color} />,
    extraTab: <VectorIcon font="Feather" name="map-pin" size={theme.rem(1.25)} color={color} />
  }

  const handleOnPress = useHandler(() => {
    resetDrawerRatio()

    switch (route.name) {
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

  return (
    <TouchableOpacity accessible={false} style={contentStyle} key={route.key} onPress={handleOnPress}>
      {icon[route.name]}
      <Label
        accessible
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
        isActive={isActive}
        openRatio={drawerOpenRatio}
        isRatioDisabled={isRatioDisabled}
      >
        {title[route.name]}
      </Label>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1,
    paddingTop: theme.rem(0.75),
    justifyContent: 'center',
    alignItems: 'center'
  }
}))

const Container = styled(View)<{ height?: number }>(() => props => ({
  height: 75.5, // Hard coded height to the size in collapsed state
  justifyContent: 'flex-end',
  overflow: 'visible'
}))

const Tabs = styled(View)(() => ({
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center'
}))

const Label = styled(Animated.Text)<{
  isActive: boolean
  isRatioDisabled: boolean
  openRatio: SharedValue<number> | undefined
}>(theme => props => [
  {
    // Copied from EdgeText
    fontFamily: theme.fontFaceDefault,
    includeFontPadding: false,

    color: props.isActive ? theme.tabBarIconHighlighted : theme.tabBarIcon,
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(2 / 16)
  },
  useAnimatedStyle(() => {
    'worklet'
    return {
      height: props.isRatioDisabled ? undefined : props.openRatio == null ? undefined : theme.units.rem * props.openRatio.value,
      opacity: props.isRatioDisabled ? undefined : props.openRatio == null ? undefined : props.openRatio.value
    }
  })
])
