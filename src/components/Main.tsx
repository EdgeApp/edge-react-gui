import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack'
import * as React from 'react'
import { Platform } from 'react-native'

import { getDeviceSettings } from '../actions/DeviceSettingsActions'
import { ENV } from '../env'
import { DEFAULT_EXPERIMENT_CONFIG, ExperimentConfig, getExperimentConfig } from '../experimentConfig'
import { useAsyncEffect } from '../hooks/useAsyncEffect'
import { useMount } from '../hooks/useMount'
import { useDispatch, useSelector } from '../types/reactRedux'
import {
  DrawerParamList,
  EdgeAppStackParamList,
  EdgeTabsParamList,
  NavigationBase,
  RootParamList,
  RootSceneProps,
  WalletsTabParamList
} from '../types/routerTypes'
import { isMaestro } from '../util/maestro'
import { logEvent } from '../util/tracking'
import { ifLoggedIn } from './hoc/IfLoggedIn'
import { BackButton } from './navigation/BackButton'
import { EdgeHeader } from './navigation/EdgeHeader'
import { HeaderBackground } from './navigation/HeaderBackground'
import { HeaderTextButton } from './navigation/HeaderTextButton'
import { ParamHeaderTitle } from './navigation/ParamHeaderTitle'
import { SideMenuButton } from './navigation/SideMenuButton'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle'
import { LoadingSplashScreen } from './progress-indicators/LoadingSplashScreen'
import { GettingStartedScene } from './scenes/GettingStartedScene'
import { HomeScene as HomeSceneComponent } from './scenes/HomeScene'
import { LoginScene } from './scenes/LoginScene'
import { TransactionDetailsScene as TransactionDetailsSceneComponent } from './scenes/TransactionDetailsScene'
import { TransactionList as TransactionListComponent } from './scenes/TransactionListScene'
import { WalletListScene as WalletListSceneComponent } from './scenes/WalletListScene'
import { DeepLinkingManager } from './services/DeepLinkingManager'
import { useTheme } from './services/ThemeContext'
import { MenuTabs } from './themed/MenuTabs'

const TransactionDetailsScene = ifLoggedIn(TransactionDetailsSceneComponent)
const TransactionList = ifLoggedIn(TransactionListComponent)
const WalletListScene = ifLoggedIn(WalletListSceneComponent)
const HomeScene = ifLoggedIn(HomeSceneComponent)

const RootStack = createStackNavigator<RootParamList>()
const Drawer = createDrawerNavigator<DrawerParamList>()
const AppStack = createStackNavigator<EdgeAppStackParamList>()
const Tabs = createBottomTabNavigator<EdgeTabsParamList>()
const WalletsStack = createStackNavigator<WalletsTabParamList>()

const headerMode = isMaestro() && Platform.OS === 'android' ? 'float' : undefined

const defaultScreenOptions: StackNavigationOptions & BottomTabNavigationOptions = {
  title: '',
  headerTitle: EdgeHeader,
  headerLeft: () => <BackButton />,
  headerRight: () => <SideMenuButton />,
  headerShown: true,
  headerMode,
  headerTitleAlign: 'center',
  headerBackground: HeaderBackground,
  headerTransparent: true
}
const firstSceneScreenOptions: StackNavigationOptions & BottomTabNavigationOptions = {
  headerLeft: () => <HeaderTextButton type="help" />,
  headerTitle: EdgeHeader,
  headerTitleAlign: 'center'
}

// -------------------------------------------------------------------------
// Tab router
// -------------------------------------------------------------------------

const EdgeWalletsTabScreen = () => {
  return (
    <WalletsStack.Navigator initialRouteName="walletList" screenOptions={defaultScreenOptions}>
      <WalletsStack.Screen
        name="transactionDetails"
        component={TransactionDetailsScene}
        options={{
          headerTitle: () => <TransactionDetailsTitle />
        }}
      />
      <WalletsStack.Screen name="walletList" component={WalletListScene} options={firstSceneScreenOptions} />
      <WalletsStack.Screen
        name="transactionList"
        component={TransactionList}
        options={{ headerTitle: () => <ParamHeaderTitle<'transactionList'> fromParams={params => params.walletName} /> }}
      />
    </WalletsStack.Navigator>
  )
}

const EdgeTabs = () => {
  const { defaultScreen } = getDeviceSettings()
  const initialRouteName = defaultScreen === 'assets' ? 'walletsTab' : 'home'

  return (
    <Tabs.Navigator
      initialRouteName={initialRouteName}
      tabBar={props => <MenuTabs {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tabs.Screen name="home" component={HomeScene} options={{ ...defaultScreenOptions, ...firstSceneScreenOptions }} />
      <Tabs.Screen name="walletsTab" component={EdgeWalletsTabScreen} />
    </Tabs.Navigator>
  )
}

// -------------------------------------------------------------------------
// Main `edgeAppStack`
// The tabs live inside this stack, as well as most app scenes.
// -------------------------------------------------------------------------

const EdgeAppStack = () => {
  return (
    <AppStack.Navigator initialRouteName="edgeTabs" screenOptions={defaultScreenOptions}>
      <AppStack.Screen
        name="edgeTabs"
        component={EdgeTabs}
        options={{
          headerShown: false
        }}
      />
    </AppStack.Navigator>
  )
}

// -------------------------------------------------------------------------
// Root router
// -------------------------------------------------------------------------

const EdgeApp = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => null}
      initialRouteName="edgeAppStack"
      screenOptions={{
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: { backgroundColor: 'transparent', bottom: 0, width: '66%' },
        headerShown: false
      }}
    >
      <Drawer.Screen name="edgeAppStack" component={EdgeAppStack} />
    </Drawer.Navigator>
  )
}

export const Main = () => {
  const theme = useTheme()
  const dispatch = useDispatch()

  // The `DeepLinkingManager` needs the navigation prop,
  // but it doesn't live in a scene, so steal the prop another way:
  const [navigation, setNavigation] = React.useState<NavigationBase | undefined>()

  // TODO: Create a new provider instead to serve the experimentConfig globally
  const [experimentConfig, setExperimentConfig] = React.useState<ExperimentConfig | undefined>(isMaestro() ? DEFAULT_EXPERIMENT_CONFIG : undefined)

  const [hasInitialScenesLoaded, setHasInitialScenesLoaded] = React.useState(false)

  // Match react navigation theme background with the patina theme
  const reactNavigationTheme = React.useMemo(() => {
    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme.backgroundGradientColors[0]
      }
    }
  }, [theme])

  const context = useSelector(state => state.core.context)
  const { localUsers } = context

  useMount(() => {
    dispatch(logEvent('Start_App', { numAccounts: localUsers.length }))
    if (localUsers.length === 0) {
      dispatch(logEvent('Start_App_No_Accounts'))
    } else {
      dispatch(logEvent('Start_App_With_Accounts'))
    }

    // Used to re-enable animations to login scene:
    setTimeout(() => {
      setHasInitialScenesLoaded(true)
    }, 0)
  })

  // Wait for the experiment config to initialize before rendering anything
  useAsyncEffect(
    async () => {
      if (isMaestro()) return
      setExperimentConfig(await getExperimentConfig())
    },
    [],
    'setLegacyLanding'
  )

  const initialRouteName = ENV.USE_WELCOME_SCREENS && localUsers.length === 0 ? 'gettingStarted' : 'login'

  return (
    <>
      {experimentConfig == null ? (
        <LoadingSplashScreen />
      ) : (
        <NavigationContainer theme={reactNavigationTheme}>
          <RootStack.Navigator
            initialRouteName={initialRouteName}
            screenOptions={{
              headerShown: false
            }}
          >
            <RootStack.Screen name="edgeApp" component={EdgeApp} />

            <RootStack.Screen name="gettingStarted" initialParams={{ experimentConfig }}>
              {(props: RootSceneProps<'gettingStarted'>) => {
                if (navigation == null) setTimeout(() => setNavigation(props.navigation as NavigationBase), 0)
                return <GettingStartedScene {...props} />
              }}
            </RootStack.Screen>

            <RootStack.Screen name="login" initialParams={{ experimentConfig }} options={{ animationEnabled: hasInitialScenesLoaded }}>
              {(props: RootSceneProps<'login'>) => {
                if (navigation == null) setTimeout(() => setNavigation(props.navigation as NavigationBase), 0)
                return <LoginScene {...props} />
              }}
            </RootStack.Screen>
          </RootStack.Navigator>
          {navigation == null ? null : <DeepLinkingManager navigation={navigation} />}
        </NavigationContainer>
      )}
    </>
  )
}
