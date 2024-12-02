import { BottomTabBarProps, BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs'
import { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import * as React from 'react'
import { useMemo } from 'react'
import { Platform, StyleSheet, TouchableOpacity } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { interpolate, SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'

import { writeDefaultScreen } from '../../actions/DeviceSettingsActions'
import { Fontello } from '../../assets/vector/index'
import { ENV } from '../../env'
import { useHandler } from '../../hooks/useHandler'
import { LocaleStringKey } from '../../locales/en_US'
import { lstrings } from '../../locales/strings'
import { useSceneFooterRenderState, useSceneFooterState } from '../../state/SceneFooterState'
import { config } from '../../theme/appConfig'
import { scale } from '../../util/scaling'
import { BlurBackgroundNoRoundedCorners } from '../common/BlurBackground'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { VectorIcon } from './VectorIcon'

const extraTabString: LocaleStringKey = config.extraTab?.tabTitleKey ?? 'title_map'

// Include the correct bottom padding to the menu bar for all devices accept for
// iOS devices with a nav bar (has a notch). This is because iOS devices with a
// nav-bar and notch include extra space according to the Apple style-guide.
// react-native-safe-area-context incorrectly applies no extra padding to iPad
// devices with a notch.
const MAYBE_BOTTOM_PADDING = Platform.OS === 'ios' && !Platform.isPad && DeviceInfo.hasNotch() ? 0 : scale(16) * 0.75

// Delay writing out defaultScreen settings when switching tabs to prevent clogging up the
// bridge and CPU while a scene transition is occurring
const SAVE_DEFAULT_SCREEN_DELAY = 3000
export const MAX_TAB_BAR_HEIGHT = 58 + MAYBE_BOTTOM_PADDING
export const MIN_TAB_BAR_HEIGHT = 40 + MAYBE_BOTTOM_PADDING

const title: { readonly [key: string]: string } = {
  home: lstrings.title_home,
  walletsTab: lstrings.title_assets,
  buyTab: lstrings.title_buy,
  sellTab: lstrings.title_sell,
  swapTab: lstrings.title_exchange,
  extraTab: lstrings[extraTabString],
  devTab: lstrings.title_dev_tab
}

export const MenuTabs = (props: BottomTabBarProps) => {
  const { navigation, state } = props
  const theme = useTheme()
  const activeTabFullIndex = state.index
  const routes = useMemo(
    () =>
      state.routes.filter(route => {
        if (config.extraTab == null && route.name === 'extraTab') {
          return false
        }
        if (!ENV.DEV_TAB && route.name === 'devTab') {
          return false
        }
        if (config.disableSwaps === true && route.name === 'swapTab') {
          return false
        }
        return true
      }),
    [state.routes]
  )

  const tabLabelHeight = theme.rem(1.1)

  const activeTabRoute = state.routes[activeTabFullIndex]
  const activeTabIndex = routes.findIndex(route => route.name === activeTabRoute.name)

  const { bottom: insetBottom } = useSafeAreaInsets()

  const footerHeight = useSceneFooterState(state => state.footerHeight)
  const footerOpenRatio = useSceneFooterState(state => state.footerOpenRatio)
  const renderFooter = useSceneFooterRenderState(state => state.renderFooter)

  const { height: keyboardHeight, progress: keyboardProgress } = useReanimatedKeyboardAnimation()
  const menuTabHeightAndInsetBottomTermForShiftY = useDerivedValue(() => keyboardProgress.value * (insetBottom + MAX_TAB_BAR_HEIGHT))
  const shiftY = useDerivedValue(() => keyboardHeight.value + menuTabHeightAndInsetBottomTermForShiftY.value)

  return (
    <Container shiftY={shiftY} pointerEvents="box-none">
      <Background footerHeight={footerHeight} openRatio={footerOpenRatio} tabLabelHeight={tabLabelHeight} pointerEvents="none">
        <BlurBackgroundNoRoundedCorners />
        <BackgroundLinearGradient colors={theme.tabBarBackground} start={theme.tabBarBackgroundStart} end={theme.tabBarBackgroundEnd} />
      </Background>
      {renderFooter()}
      <Tabs openRatio={footerOpenRatio} tabLabelHeight={tabLabelHeight}>
        {routes.map((route, index: number) => (
          <Tab
            currentName={routes[activeTabIndex].name}
            navigation={navigation}
            key={route.name}
            route={route}
            isActive={activeTabIndex === index}
            footerOpenRatio={footerOpenRatio}
          />
        ))}
      </Tabs>
    </Container>
  )
}

const Container = styled(Animated.View)<{ shiftY: SharedValue<number> }>(() => ({ shiftY }) => [
  {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    overflow: 'visible'
  },
  useAnimatedStyle(() => ({
    transform: [
      {
        translateY: shiftY.value
      }
    ]
  }))
])

const Background = styled(Animated.View)<{ footerHeight: SharedValue<number>; openRatio: SharedValue<number>; tabLabelHeight: number }>(
  () =>
    ({ footerHeight: footerHeightRef, openRatio, tabLabelHeight }) => {
      return [
        {
          ...StyleSheet.absoluteFillObject
        },
        useAnimatedStyle(() => {
          const openRatioInverted = interpolate(openRatio.value, [0, 1], [1, 0])
          const offsetFooterHeight = openRatioInverted * footerHeightRef.value
          const offsetTabLabelHeight = openRatioInverted * tabLabelHeight
          return {
            transform: [
              {
                translateY: offsetFooterHeight + offsetTabLabelHeight
              }
            ]
          }
        })
      ]
    }
)

const BackgroundLinearGradient = styled(LinearGradient)({
  flex: 1
})

const Tabs = styled(Animated.View)<{ openRatio: SharedValue<number>; tabLabelHeight: number }>(() => ({ openRatio, tabLabelHeight }) => {
  return [
    {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(openRatio.value, [1, 0], [0, 1]) * tabLabelHeight
        }
      ]
    }))
  ]
})

const Tab = ({
  route,
  isActive,
  footerOpenRatio,
  currentName,
  navigation
}: {
  isActive: boolean
  currentName: string
  route: BottomTabBarProps['state']['routes'][number]
  footerOpenRatio: SharedValue<number>
  navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>
}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const color = isActive ? theme.tabBarIconHighlighted : theme.tabBarIcon

  const icon: { readonly [key: string]: JSX.Element } = {
    home: <SimpleLineIcons name="home" size={theme.rem(1.25)} color={color} />,
    walletsTab: <Fontello name="wallet-1" size={theme.rem(1.25)} color={color} />,
    buyTab: <Fontello name="buy" size={theme.rem(1.25)} color={color} />,
    sellTab: <Fontello name="sell" size={theme.rem(1.25)} color={color} />,
    swapTab: <Ionicon name="swap-horizontal" size={theme.rem(1.25)} color={color} />,
    extraTab: <VectorIcon font="Feather" name="map-pin" size={theme.rem(1.25)} color={color} />,
    devTab: <SimpleLineIcons name="wrench" size={theme.rem(1.25)} color={color} />
  }

  const handleOnPress = useHandler(() => {
    switch (route.name) {
      case 'home':
        setTimeout(() => {
          writeDefaultScreen('home').catch(e => console.error('Failed to write defaultScreen setting: home'))
        }, SAVE_DEFAULT_SCREEN_DELAY)
        return navigation.navigate('home')
      case 'walletsTab':
        setTimeout(() => {
          writeDefaultScreen('assets').catch(e => console.error('Failed to write defaultScreen setting: assets'))
        }, SAVE_DEFAULT_SCREEN_DELAY)
        return navigation.navigate('walletsTab', currentName === 'walletsTab' ? { screen: 'walletList' } : {})
      case 'buyTab':
        return navigation.navigate('buyTab', currentName === 'buyTab' ? { screen: 'pluginListBuy' } : {})
      case 'sellTab':
        return navigation.navigate('sellTab', currentName === 'sellTab' ? { screen: 'pluginListSell' } : {})
      case 'swapTab':
        return navigation.navigate('swapTab', currentName === 'swapTab' ? { screen: 'swapCreate' } : {})
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
  paddingBottom: MAYBE_BOTTOM_PADDING,
  marginBottom: insetBottom,
  justifyContent: 'center',
  alignItems: 'center'
}))

const Label = styled(Animated.Text)<{
  isActive: boolean
  openRatio: SharedValue<number>
}>(theme => ({ isActive, openRatio }) => {
  return [
    {
      // Copied from EdgeText
      fontFamily: theme.fontFaceDefault,
      includeFontPadding: false,

      color: isActive ? theme.tabBarIconHighlighted : theme.tabBarIcon,
      fontSize: theme.rem(0.75),
      paddingTop: theme.rem(2 / 16),
      height: theme.rem(1.1)
    },
    useAnimatedStyle(() => {
      'worklet'
      if (openRatio == null) return {}
      return {
        opacity: interpolate(openRatio.value, [1, 0.5], [1, 0])
      }
    })
  ]
})
