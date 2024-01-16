import { BottomTabBarProps, BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs'
import { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import * as React from 'react'
import { useMemo } from 'react'
import { Platform, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'

import { showBackupForTransferModal } from '../../actions/BackupModalActions'
import { Fontello } from '../../assets/vector/index'
import { ENV } from '../../env'
import { useHandler } from '../../hooks/useHandler'
import { LocaleStringKey } from '../../locales/en_US'
import { lstrings } from '../../locales/strings'
import { useFooterOpenRatio } from '../../state/SceneFooterState'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { BlurBackground } from '../ui4/BlurBackground'
import { VectorIcon } from './VectorIcon'

const extraTabString: LocaleStringKey = config.extraTab?.tabTitleKey ?? 'title_map'

export const MAX_TAB_BAR_HEIGHT = 92
export const MIN_TAB_BAR_HEIGHT = 74

const title: { readonly [key: string]: string } = {
  homeTab: lstrings.title_home,
  walletsTab: lstrings.title_assets,
  buyTab: lstrings.title_buy,
  sellTab: lstrings.title_sell,
  exchangeTab: lstrings.title_exchange,
  extraTab: lstrings[extraTabString],
  devTab: lstrings.title_dev_tab
}

export const MenuTabs = (props: BottomTabBarProps) => {
  const { navigation, state } = props
  const theme = useTheme()
  const activeTabFullIndex = state.index
  const colors = Platform.OS === 'ios' ? theme.tabBarBackgroundIos : theme.tabBarBackground
  const start = theme.tabBarBackgroundStart
  const end = theme.tabBarBackgroundEnd
  const routes = useMemo(
    () =>
      state.routes.filter(route => {
        if (config.extraTab == null && route.name === 'extraTab') {
          return false
        }
        if (!ENV.DEV_TAB && route.name === 'devTab') {
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

  const { footerOpenRatio, resetFooterRatio } = useFooterOpenRatio()

  return (
    <Container>
      <BlurBackground />
      <LinearGradient colors={colors} start={start} end={end}>
        <Tabs>
          {routes.map((route, index: number) => (
            <Tab
              currentName={routes[activeTabIndex].name}
              navigation={navigation}
              key={route.name}
              route={route}
              isActive={activeTabIndex === index}
              footerOpenRatio={footerOpenRatio}
              resetFooterRatio={resetFooterRatio}
            />
          ))}
        </Tabs>
      </LinearGradient>
    </Container>
  )
}

const Container = styled(View)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'flex-end',
  overflow: 'visible'
})

const Tabs = styled(View)({
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center'
})

const Tab = ({
  route,
  isActive,
  footerOpenRatio,
  resetFooterRatio,
  currentName,
  navigation
}: {
  isActive: boolean
  currentName: string
  route: BottomTabBarProps['state']['routes'][number]
  footerOpenRatio: SharedValue<number>
  resetFooterRatio: () => void
  navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>
}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const color = isActive ? theme.tabBarIconHighlighted : theme.tabBarIcon

  const activeUsername = useSelector(state => state.core.account.username)
  const isLightAccount = activeUsername == null

  const icon: { readonly [key: string]: JSX.Element } = {
    homeTab: <SimpleLineIcons name="home" size={theme.rem(1.25)} color={color} />,
    walletsTab: <Fontello name="wallet-1" size={theme.rem(1.25)} color={color} />,
    buyTab: <Fontello name="buy" size={theme.rem(1.25)} color={color} />,
    sellTab: <Fontello name="sell" size={theme.rem(1.25)} color={color} />,
    exchangeTab: <Ionicon name="swap-horizontal" size={theme.rem(1.25)} color={color} />,
    extraTab: <VectorIcon font="Feather" name="map-pin" size={theme.rem(1.25)} color={color} />,
    devTab: <SimpleLineIcons name="wrench" size={theme.rem(1.25)} color={color} />
  }

  const handleOnPress = useHandler(() => {
    resetFooterRatio()

    switch (route.name) {
      case 'homeTab':
        return navigation.navigate('home', currentName === 'homeTab' ? { screen: 'home' } : {})
      case 'walletsTab':
        return navigation.navigate('walletsTab', currentName === 'walletsTab' ? { screen: 'walletList' } : {})
      case 'buyTab':
        if (isLightAccount) {
          showBackupForTransferModal(() => navigation.navigate('upgradeUsername', {}))
        } else {
          return navigation.navigate('buyTab', currentName === 'buyTab' ? { screen: 'pluginListBuy' } : {})
        }
        break
      case 'sellTab':
        if (isLightAccount) {
          showBackupForTransferModal(() => navigation.navigate('upgradeUsername', {}))
        } else {
          return navigation.navigate('sellTab', currentName === 'sellTab' ? { screen: 'pluginListSell' } : {})
        }
        break
      case 'exchangeTab':
        return navigation.navigate('exchangeTab', currentName === 'exchangeTab' ? { screen: 'exchange' } : {})
      case 'extraTab':
        return navigation.navigate('extraTab')
      case 'devTab':
        return navigation.navigate('devTab')
    }
  })

  return (
    <TabContainer accessible={false} insetBottom={insets.bottom} key={route.key} onPress={handleOnPress}>
      {icon[route.name]}
      <Label accessible numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} isActive={isActive} openRatio={footerOpenRatio}>
        {title[route.name]}
      </Label>
    </TabContainer>
  )
}

const TabContainer = styled(TouchableOpacity)<{ insetBottom: number }>(theme => ({ insetBottom }) => ({
  flex: 1,
  paddingTop: theme.rem(0.75),
  paddingBottom: Math.max(theme.rem(0.75), insetBottom),
  justifyContent: 'center',
  alignItems: 'center'
}))

const Label = styled(Animated.Text)<{
  isActive: boolean
  openRatio: SharedValue<number>
}>(theme => ({ isActive, openRatio }) => {
  const rem = theme.rem(1)
  return [
    {
      // Copied from EdgeText
      fontFamily: theme.fontFaceDefault,
      includeFontPadding: false,

      color: isActive ? theme.tabBarIconHighlighted : theme.tabBarIcon,
      fontSize: theme.rem(0.75),
      marginTop: theme.rem(2 / 16)
    },
    useAnimatedStyle(() => {
      'worklet'
      if (openRatio == null) return {}
      return {
        height: rem * openRatio.value,
        opacity: openRatio.value
      }
    })
  ]
})
