import { BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack'
import * as React from 'react'
import { Platform } from 'react-native'

import { getDeviceSettings } from '../actions/DeviceSettingsActions'
import { getFirstOpenInfo } from '../actions/FirstOpenActions'
import { SwapCreateScene as SwapCreateSceneComponent } from '../components/scenes/SwapCreateScene'
import { ENV } from '../env'
import { DEFAULT_EXPERIMENT_CONFIG, ExperimentConfig, getExperimentConfig } from '../experimentConfig'
import { useAsyncEffect } from '../hooks/useAsyncEffect'
import { useMount } from '../hooks/useMount'
import { lstrings } from '../locales/strings'
import { AddressFormScene } from '../plugins/gui/scenes/AddressFormScene'
import { FiatPluginEnterAmountScene as FiatPluginEnterAmountSceneComponent } from '../plugins/gui/scenes/FiatPluginEnterAmountScene'
import { FiatPluginWebViewComponent } from '../plugins/gui/scenes/FiatPluginWebView'
import { InfoDisplayScene } from '../plugins/gui/scenes/InfoDisplayScene'
import { RewardsCardDashboardScene as RewardsCardListSceneComponent } from '../plugins/gui/scenes/RewardsCardDashboardScene'
import { RewardsCardWelcomeScene as RewardsCardWelcomeSceneComponent } from '../plugins/gui/scenes/RewardsCardWelcomeScene'
import { SepaFormScene } from '../plugins/gui/scenes/SepaFormScene'
import { useDispatch, useSelector } from '../types/reactRedux'
import {
  BuyTabParamList,
  DrawerParamList,
  EdgeAppStackParamList,
  EdgeTabsParamList,
  NavigationBase,
  RootParamList,
  RootSceneProps,
  SwapTabParamList,
  WalletsTabParamList
} from '../types/routerTypes'
import { isMaestro } from '../util/maestro'
import { logEvent } from '../util/tracking'
import { getUkCompliantString } from '../util/ukComplianceUtils'
import { ifLoggedIn } from './hoc/IfLoggedIn'
import { BackButton } from './navigation/BackButton'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle'
import { EdgeHeader } from './navigation/EdgeHeader'
import { PluginBackButton } from './navigation/GuiPluginBackButton'
import { HeaderBackground } from './navigation/HeaderBackground'
import { HeaderTextButton } from './navigation/HeaderTextButton'
import { ParamHeaderTitle } from './navigation/ParamHeaderTitle'
import { SideMenuButton } from './navigation/SideMenuButton'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle'
import { LoadingSplashScreen } from './progress-indicators/LoadingSplashScreen'
import { AssetSettingsScene as AssetSettingsSceneComponent } from './scenes/AssetSettingsScene'
import { ChangeMiningFeeScene as ChangeMiningFeeSceneComponent } from './scenes/ChangeMiningFeeScene'
import { ChangePasswordScene as ChangePasswordSceneComponent } from './scenes/ChangePasswordScene'
import { ChangePinScene as ChangePinSceneComponent } from './scenes/ChangePinScene'
import { CoinRankingDetailsScene as CoinRankingDetailsSceneComponent } from './scenes/CoinRankingDetailsScene'
import { CoinRankingScene as CoinRankingSceneComponent } from './scenes/CoinRankingScene'
import { ConfirmScene as ConfirmSceneComponent } from './scenes/ConfirmScene'
import { CreateWalletAccountSelectScene as CreateWalletAccountSelectSceneComponent } from './scenes/CreateWalletAccountSelectScene'
import { CreateWalletAccountSetupScene as CreateWalletAccountSetupSceneComponent } from './scenes/CreateWalletAccountSetupScene'
import { CreateWalletCompletionScene as CreateWalletCompletionSceneComponent } from './scenes/CreateWalletCompletionScene'
import { CreateWalletEditNameScene as CreateWalletSelectFiatSceneComponent } from './scenes/CreateWalletEditNameScene'
import { CreateWalletImportOptionsScene as CreateWalletImportOptionsSceneComponent } from './scenes/CreateWalletImportOptionsScene'
import { CreateWalletImportScene as CreateWalletImportSceneComponent } from './scenes/CreateWalletImportScene'
import { CreateWalletSelectCryptoScene as CreateWalletSelectCryptoSceneComponent } from './scenes/CreateWalletSelectCryptoScene'
import { CurrencyNotificationScene as CurrencyNotificationSceneComponent } from './scenes/CurrencyNotificationScene'
import { CurrencySettingsScene as CurrencySettingsSceneComponent } from './scenes/CurrencySettingsScene'
import { DefaultFiatSettingScene as DefaultFiatSettingSceneComponent } from './scenes/DefaultFiatSettingScene'
import { DevTestScene } from './scenes/DevTestScene'
import { EdgeLoginScene as EdgeLoginSceneComponent } from './scenes/EdgeLoginScene'
import { EditTokenScene as EditTokenSceneComponent } from './scenes/EditTokenScene'
import { ExtraTabScene as ExtraTabSceneComponent } from './scenes/ExtraTabScene'
import { FioAddressDetailsScene as FioAddressDetailsSceneComponent } from './scenes/Fio/FioAddressDetailsScene'
import { FioAddressListScene as FioAddressListSceneComponent } from './scenes/Fio/FioAddressListScene'
import { FioAddressRegisteredScene as FioAddressRegisteredSceneComponent } from './scenes/Fio/FioAddressRegisteredScene'
import { FioAddressRegisterScene as FioAddressRegisterSceneComponent } from './scenes/Fio/FioAddressRegisterScene'
import { FioAddressRegisterSelectWalletScene as FioAddressRegisterSelectWalletSceneComponent } from './scenes/Fio/FioAddressRegisterSelectWalletScene'
import { FioAddressSettingsScene as FioAddressSettingsSceneComponent } from './scenes/Fio/FioAddressSettingsScene'
import { FioConnectWalletConfirmScene as FioConnectWalletConfirmSceneComponent } from './scenes/Fio/FioConnectWalletConfirmScene'
import { FioCreateHandleScene as FioCreateHandleSceneComponent } from './scenes/Fio/FioCreateHandleScene'
import { FioDomainRegisterScene as FioDomainRegisterSceneComponent } from './scenes/Fio/FioDomainRegisterScene'
import { FioDomainRegisterSelectWalletScene as FioDomainRegisterSelectWalletSceneComponent } from './scenes/Fio/FioDomainRegisterSelectWalletScene'
import { FioDomainSettingsScene as FioDomainSettingsSceneComponent } from './scenes/Fio/FioDomainSettingsScene'
import { FioNameConfirmScene as FioNameConfirmSceneComponent } from './scenes/Fio/FioNameConfirmScene'
import { FioRequestConfirmationScene as FioRequestConfirmationSceneComponent } from './scenes/Fio/FioRequestConfirmationScene'
import { FioRequestListScene as FioRequestListSceneComponent } from './scenes/Fio/FioRequestListScene'
import { FioSentRequestDetailsScene as FioSentRequestDetailsSceneComponent } from './scenes/Fio/FioSentRequestDetailsScene'
import { FioStakingChangeScene as FioStakingChangeSceneComponent } from './scenes/Fio/FioStakingChangeScene'
import { FioStakingOverviewScene as FioStakingOverviewSceneComponent } from './scenes/Fio/FioStakingOverviewScene'
import { GettingStartedScene } from './scenes/GettingStartedScene'
import { GuiPluginListScene as GuiPluginListSceneComponent } from './scenes/GuiPluginListScene'
import { GuiPluginViewScene as GuiPluginViewSceneComponent } from './scenes/GuiPluginViewScene'
import { HomeScene as HomeSceneComponent } from './scenes/HomeScene'
import { LoanCloseScene as LoanCloseSceneComponent } from './scenes/Loans/LoanCloseScene'
import { LoanCreateConfirmationScene as LoanCreateConfirmationSceneComponent } from './scenes/Loans/LoanCreateConfirmationScene'
import { LoanCreateScene as LoanCreateSceneComponent } from './scenes/Loans/LoanCreateScene'
import { LoanDashboardScene as LoanDashboardSceneComponent } from './scenes/Loans/LoanDashboardScene'
import { LoanDetailsScene as LoanDetailsSceneComponent } from './scenes/Loans/LoanDetailsScene'
import { LoanManageScene as LoanManageSceneComponent } from './scenes/Loans/LoanManageScene'
import { LoanStatusScene as LoanStatusSceneComponent } from './scenes/Loans/LoanStatusScene'
import { LoginScene } from './scenes/LoginScene'
import { ManageTokensScene as ManageTokensSceneComponent } from './scenes/ManageTokensScene'
import { MigrateWalletCalculateFeeScene as MigrateWalletCalculateFeeSceneComponent } from './scenes/MigrateWalletCalculateFeeScene'
import { MigrateWalletCompletionScene as MigrateWalletCompletionSceneComponent } from './scenes/MigrateWalletCompletionScene'
import { MigrateWalletSelectCryptoScene as MigrateWalletSelectCryptoSceneComponent } from './scenes/MigrateWalletSelectCryptoScene'
import { NotificationScene as NotificationSceneComponent } from './scenes/NotificationScene'
import { OtpRepairScene as OtpRepairSceneComponent } from './scenes/OtpRepairScene'
import { OtpSettingsScene as OtpSettingsSceneComponent } from './scenes/OtpSettingsScene'
import { ChangeRecoveryScene as ChangeRecoverySceneComponent } from './scenes/PasswordRecoveryScene'
import { PromotionSettingsScene as PromotionSettingsSceneComponent } from './scenes/PromotionSettingsScene'
import { RequestScene as RequestSceneComponent } from './scenes/RequestScene'
import { SecurityAlertsScene as SecurityAlertsSceneComponent } from './scenes/SecurityAlertsScene'
import { SendScene2 as SendScene2Component } from './scenes/SendScene2'
import { SettingsScene as SettingsSceneComponent } from './scenes/SettingsScene'
import { SpendingLimitsScene as SpendingLimitsSceneComponent } from './scenes/SpendingLimitsScene'
import { EarnScene as EarnSceneComponent } from './scenes/Staking/EarnScene'
import { StakeModifyScene as StakeModifySceneComponent } from './scenes/Staking/StakeModifyScene'
import { StakeOptionsScene as StakeOptionsSceneComponent } from './scenes/Staking/StakeOptionsScene'
import { StakeOverviewScene as StakeOverviewSceneComponent } from './scenes/Staking/StakeOverviewScene'
import { SwapConfirmationScene as SwapConfirmationSceneComponent } from './scenes/SwapConfirmationScene'
import { SwapProcessingScene as SwapProcessingSceneComponent } from './scenes/SwapProcessingScene'
import { SwapSettingsScene as SwapSettingsSceneComponent } from './scenes/SwapSettingsScene'
import { SwapSuccessScene as SwapSuccessSceneComponent } from './scenes/SwapSuccessScene'
import { SweepPrivateKeyCalculateFeeScene as SweepPrivateKeyCalculateFeeSceneComponent } from './scenes/SweepPrivateKeyCalculateFeeScene'
import { SweepPrivateKeyCompletionScene as SweepPrivateKeyCompletionSceneComponent } from './scenes/SweepPrivateKeyCompletionScene'
import { SweepPrivateKeyProcessingScene as SweepPrivateKeyProcessingSceneComponent } from './scenes/SweepPrivateKeyProcessingScene'
import { SweepPrivateKeySelectCryptoScene as SweepPrivateKeySelectCryptoSceneComponent } from './scenes/SweepPrivateKeySelectCryptoScene'
import { TransactionDetailsScene as TransactionDetailsSceneComponent } from './scenes/TransactionDetailsScene'
import { TransactionList as TransactionListComponent } from './scenes/TransactionListScene'
import { TransactionsExportScene as TransactionsExportSceneComponent } from './scenes/TransactionsExportScene'
import { UpgradeUsernameScene as UpgradeUsernameSceneComponent } from './scenes/UpgradeUsernameScreen'
import { WalletListScene as WalletListSceneComponent } from './scenes/WalletListScene'
import { WalletRestoreScene as WalletRestoreSceneComponent } from './scenes/WalletRestoreScene'
import { WcConnectionsScene as WcConnectionsSceneComponent } from './scenes/WcConnectionsScene'
import { WcConnectScene as WcConnectSceneComponent } from './scenes/WcConnectScene'
import { WcDisconnectScene as WcDisconnectSceneComponent } from './scenes/WcDisconnectScene'
import { WebViewScene as WebViewSceneComponent } from './scenes/WebViewScene'
import { DeepLinkingManager } from './services/DeepLinkingManager'
import { useTheme } from './services/ThemeContext'
import { MenuTabs } from './themed/MenuTabs'
import { SideMenu } from './themed/SideMenu'

const ChangeMiningFeeScene = ifLoggedIn(ChangeMiningFeeSceneComponent)
const ChangePasswordScene = ifLoggedIn(ChangePasswordSceneComponent)
const ChangePinScene = ifLoggedIn(ChangePinSceneComponent)
const ChangeRecoveryScene = ifLoggedIn(ChangeRecoverySceneComponent)
const UpgradeUsernameScene = ifLoggedIn(UpgradeUsernameSceneComponent)
const CoinRankingDetailsScene = ifLoggedIn(CoinRankingDetailsSceneComponent)
const CoinRankingScene = ifLoggedIn(CoinRankingSceneComponent)
const ConfirmScene = ifLoggedIn(ConfirmSceneComponent)
const CreateWalletAccountSelectScene = ifLoggedIn(CreateWalletAccountSelectSceneComponent)
const CreateWalletAccountSetupScene = ifLoggedIn(CreateWalletAccountSetupSceneComponent)
const CreateWalletCompletionScene = ifLoggedIn(CreateWalletCompletionSceneComponent)
const CreateWalletImportScene = ifLoggedIn(CreateWalletImportSceneComponent)
const CreateWalletImportOptionsScene = ifLoggedIn(CreateWalletImportOptionsSceneComponent)
const CreateWalletSelectCryptoScene = ifLoggedIn(CreateWalletSelectCryptoSceneComponent)
const CreateWalletSelectFiatScene = ifLoggedIn(CreateWalletSelectFiatSceneComponent)
const CurrencyNotificationScene = ifLoggedIn(CurrencyNotificationSceneComponent)
const AssetSettingsScene = ifLoggedIn(AssetSettingsSceneComponent)
const CurrencySettingsScene = ifLoggedIn(CurrencySettingsSceneComponent)
const DefaultFiatSettingScene = ifLoggedIn(DefaultFiatSettingSceneComponent)
const EdgeLoginScene = ifLoggedIn(EdgeLoginSceneComponent)
const EditTokenScene = ifLoggedIn(EditTokenSceneComponent)
const EarnScene = ifLoggedIn(EarnSceneComponent)
const ExtraTabScene = ifLoggedIn(ExtraTabSceneComponent)
const FiatPluginEnterAmountScene = ifLoggedIn(FiatPluginEnterAmountSceneComponent)
const FioAddressDetailsScene = ifLoggedIn(FioAddressDetailsSceneComponent)
const FioAddressListScene = ifLoggedIn(FioAddressListSceneComponent)
const FioAddressRegisteredScene = ifLoggedIn(FioAddressRegisteredSceneComponent)
const FioAddressRegisterScene = ifLoggedIn(FioAddressRegisterSceneComponent)
const FioAddressRegisterSelectWalletScene = ifLoggedIn(FioAddressRegisterSelectWalletSceneComponent)
const FioAddressSettingsScene = ifLoggedIn(FioAddressSettingsSceneComponent)
const FioConnectWalletConfirmScene = ifLoggedIn(FioConnectWalletConfirmSceneComponent)
const FioCreateHandleScene = ifLoggedIn(FioCreateHandleSceneComponent)
const FioDomainRegisterScene = ifLoggedIn(FioDomainRegisterSceneComponent)
const FioDomainRegisterSelectWalletScene = ifLoggedIn(FioDomainRegisterSelectWalletSceneComponent)
const FioDomainSettingsScene = ifLoggedIn(FioDomainSettingsSceneComponent)
const FioNameConfirmScene = ifLoggedIn(FioNameConfirmSceneComponent)
const FioRequestConfirmationScene = ifLoggedIn(FioRequestConfirmationSceneComponent)
const FioRequestListScene = ifLoggedIn(FioRequestListSceneComponent)
const FioSentRequestDetailsScene = ifLoggedIn(FioSentRequestDetailsSceneComponent)
const FioStakingChangeScene = ifLoggedIn(FioStakingChangeSceneComponent)
const FioStakingOverviewScene = ifLoggedIn(FioStakingOverviewSceneComponent)
const GuiPluginListScene = ifLoggedIn(GuiPluginListSceneComponent)
const GuiPluginViewScene = ifLoggedIn(GuiPluginViewSceneComponent)
const LoanCloseScene = ifLoggedIn(LoanCloseSceneComponent)
const LoanCreateConfirmationScene = ifLoggedIn(LoanCreateConfirmationSceneComponent)
const LoanCreateScene = ifLoggedIn(LoanCreateSceneComponent)
const LoanDashboardScene = ifLoggedIn(LoanDashboardSceneComponent)
const LoanDetailsScene = ifLoggedIn(LoanDetailsSceneComponent)
const LoanManageScene = ifLoggedIn(LoanManageSceneComponent)
const LoanStatusScene = ifLoggedIn(LoanStatusSceneComponent)
const ManageTokensScene = ifLoggedIn(ManageTokensSceneComponent)
const SweepPrivateKeyCalculateFeeScene = ifLoggedIn(SweepPrivateKeyCalculateFeeSceneComponent)
const SweepPrivateKeyCompletionScene = ifLoggedIn(SweepPrivateKeyCompletionSceneComponent)
const SweepPrivateKeySelectCryptoScene = ifLoggedIn(SweepPrivateKeySelectCryptoSceneComponent)
const SweepPrivateKeyProcessingScene = ifLoggedIn(SweepPrivateKeyProcessingSceneComponent)
const MigrateWalletCalculateFeeScene = ifLoggedIn(MigrateWalletCalculateFeeSceneComponent)
const MigrateWalletCompletionScene = ifLoggedIn(MigrateWalletCompletionSceneComponent)
const MigrateWalletSelectCryptoScene = ifLoggedIn(MigrateWalletSelectCryptoSceneComponent)
const NotificationScene = ifLoggedIn(NotificationSceneComponent)
const OtpRepairScene = ifLoggedIn(OtpRepairSceneComponent)
const OtpSettingsScene = ifLoggedIn(OtpSettingsSceneComponent)
const PromotionSettingsScene = ifLoggedIn(PromotionSettingsSceneComponent)
const RequestScene = ifLoggedIn(RequestSceneComponent)
const SecurityAlertsScene = ifLoggedIn(SecurityAlertsSceneComponent)
const SendScene2 = ifLoggedIn(SendScene2Component)
const SettingsScene = ifLoggedIn(SettingsSceneComponent)
const SpendingLimitsScene = ifLoggedIn(SpendingLimitsSceneComponent)
const RewardsCardDashboardScene = ifLoggedIn(RewardsCardListSceneComponent)
const RewardsCardWelcomeScene = ifLoggedIn(RewardsCardWelcomeSceneComponent)
const StakeModifyScene = ifLoggedIn(StakeModifySceneComponent)
const StakeOptionsScene = ifLoggedIn(StakeOptionsSceneComponent)
const StakeOverviewScene = ifLoggedIn(StakeOverviewSceneComponent)
const SwapProcessingScene = ifLoggedIn(SwapProcessingSceneComponent)
const SwapConfirmationScene = ifLoggedIn(SwapConfirmationSceneComponent)
const SwapCreateScene = ifLoggedIn(SwapCreateSceneComponent)
const SwapSettingsScene = ifLoggedIn(SwapSettingsSceneComponent)
const SwapSuccessScene = ifLoggedIn(SwapSuccessSceneComponent)
const TransactionDetailsScene = ifLoggedIn(TransactionDetailsSceneComponent)
const TransactionList = ifLoggedIn(TransactionListComponent)
const TransactionsExportScene = ifLoggedIn(TransactionsExportSceneComponent)
const WalletListScene = ifLoggedIn(WalletListSceneComponent)
const WalletRestoreScene = ifLoggedIn(WalletRestoreSceneComponent)
const WcConnectionsScene = ifLoggedIn(WcConnectionsSceneComponent)
const WcConnectScene = ifLoggedIn(WcConnectSceneComponent)
const WcDisconnectScene = ifLoggedIn(WcDisconnectSceneComponent)
const WebViewScene = ifLoggedIn(WebViewSceneComponent)
const HomeScene = ifLoggedIn(HomeSceneComponent)

const RootStack = createStackNavigator<RootParamList>()
const Drawer = createDrawerNavigator<DrawerParamList>()
const AppStack = createStackNavigator<EdgeAppStackParamList>()
const Tabs = createBottomTabNavigator<EdgeTabsParamList>()
const SwapStack = createStackNavigator<SwapTabParamList>()
const BuyStack = createStackNavigator<BuyTabParamList>()
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

const EdgeBuyTabScreen = () => {
  return (
    <BuyStack.Navigator initialRouteName="pluginListBuy" screenOptions={defaultScreenOptions}>
      <BuyStack.Screen name="pluginListBuy" component={GuiPluginListScene} options={firstSceneScreenOptions} />
      <BuyStack.Screen
        name="pluginViewBuy"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewBuy'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <BuyStack.Screen
        name="guiPluginAddressForm"
        component={AddressFormScene}
        options={{
          headerRight: () => null
        }}
      />
      <BuyStack.Screen
        name="guiPluginEnterAmount"
        component={FiatPluginEnterAmountScene}
        options={{
          headerRight: () => null
        }}
      />
      <BuyStack.Screen
        name="guiPluginInfoDisplay"
        component={InfoDisplayScene}
        options={{
          headerRight: () => null
        }}
      />
      <BuyStack.Screen
        name="guiPluginSepaForm"
        component={SepaFormScene}
        options={{
          headerRight: () => null
        }}
      />
      <BuyStack.Screen name="guiPluginWebView" component={FiatPluginWebViewComponent} />
      <BuyStack.Screen name="rewardsCardDashboard" component={RewardsCardDashboardScene} />
      <BuyStack.Screen name="rewardsCardWelcome" component={RewardsCardWelcomeScene} />
    </BuyStack.Navigator>
  )
}

const EdgeSellTabScreen = () => {
  return (
    <BuyStack.Navigator initialRouteName="pluginListSell" screenOptions={defaultScreenOptions}>
      <BuyStack.Screen name="pluginListSell" component={GuiPluginListScene} options={firstSceneScreenOptions} />
      <BuyStack.Screen
        name="pluginViewSell"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewSell'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <BuyStack.Screen
        name="guiPluginAddressForm"
        component={AddressFormScene}
        options={{
          headerRight: () => null
        }}
      />
      <BuyStack.Screen
        name="guiPluginEnterAmount"
        component={FiatPluginEnterAmountScene}
        options={{
          headerRight: () => null
        }}
      />
      <BuyStack.Screen
        name="guiPluginInfoDisplay"
        component={InfoDisplayScene}
        options={{
          headerRight: () => null
        }}
      />
      <BuyStack.Screen
        name="guiPluginSepaForm"
        component={SepaFormScene}
        options={{
          headerRight: () => null
        }}
      />
      <BuyStack.Screen name="guiPluginWebView" component={FiatPluginWebViewComponent} />
      <BuyStack.Screen name="rewardsCardDashboard" component={RewardsCardDashboardScene} />
      <BuyStack.Screen name="rewardsCardWelcome" component={RewardsCardWelcomeScene} />
    </BuyStack.Navigator>
  )
}

const EdgeSwapTabScreen = () => {
  return (
    <SwapStack.Navigator initialRouteName="swapCreate" screenOptions={defaultScreenOptions}>
      <SwapStack.Screen
        name="swapCreate"
        component={SwapCreateScene}
        options={{
          ...firstSceneScreenOptions,
          title: lstrings.title_exchange
        }}
      />
      <SwapStack.Screen name="swapConfirmation" component={SwapConfirmationScene} />
      <SwapStack.Screen
        name="swapProcessing"
        component={SwapProcessingScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
    </SwapStack.Navigator>
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
      <Tabs.Screen name="buyTab" component={EdgeBuyTabScreen} />
      <Tabs.Screen name="sellTab" component={EdgeSellTabScreen} />
      <Tabs.Screen name="swapTab" component={EdgeSwapTabScreen} />
      <Tabs.Screen name="extraTab" component={ExtraTabScene} />
      <Tabs.Screen name="devTab" component={DevTestScene} />
    </Tabs.Navigator>
  )
}

// -------------------------------------------------------------------------
// Main `edgeAppStack`
// The tabs live inside this stack, as well as most app scenes.
// -------------------------------------------------------------------------

const EdgeAppStack = () => {
  const [countryCode, setCountryCode] = React.useState<string | undefined>()

  useAsyncEffect(
    async () => {
      setCountryCode((await getFirstOpenInfo()).countryCode)
    },
    [],
    'EdgeAppStack'
  )

  return (
    <AppStack.Navigator initialRouteName="edgeTabs" screenOptions={defaultScreenOptions}>
      <AppStack.Screen
        name="edgeTabs"
        component={EdgeTabs}
        options={{
          headerShown: false
        }}
      />

      <AppStack.Screen
        name="changeMiningFee2"
        component={ChangeMiningFeeScene}
        options={{
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <AppStack.Screen
        name="changePassword"
        component={ChangePasswordScene}
        options={{
          title: lstrings.title_change_password,
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="changePin"
        component={ChangePinScene}
        options={{
          title: lstrings.title_change_pin,
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="coinRanking" component={CoinRankingScene} />
      <AppStack.Screen name="coinRankingDetails" component={CoinRankingDetailsScene} />
      <AppStack.Screen name="confirmScene" component={ConfirmScene} />
      <AppStack.Screen
        name="createWalletAccountSelect"
        component={CreateWalletAccountSelectScene}
        options={{
          title: lstrings.create_wallet_account_activate,
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <AppStack.Screen
        name="createWalletAccountSetup"
        component={CreateWalletAccountSetupScene}
        options={{
          title: lstrings.create_wallet_create_account,
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <AppStack.Screen
        name="createWalletCompletion"
        component={CreateWalletCompletionScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="createWalletImport"
        component={CreateWalletImportScene}
        options={{
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="createWalletImportOptions"
        component={CreateWalletImportOptionsScene}
        options={{
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="createWalletSelectCrypto" component={CreateWalletSelectCryptoScene} />
      <AppStack.Screen
        name="createWalletSelectCryptoNewAccount"
        component={CreateWalletSelectCryptoScene}
        options={{
          headerRight: () => null,
          headerLeft: () => null
        }}
      />
      <AppStack.Screen name="createWalletEditName" component={CreateWalletSelectFiatScene} />
      <AppStack.Screen
        name="currencyNotificationSettings"
        component={CurrencyNotificationScene}
        options={{
          headerTitle: props => <CurrencySettingsTitle />,
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="assetSettings"
        component={AssetSettingsScene}
        options={{
          title: lstrings.settings_asset_settings,
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="currencySettings"
        component={CurrencySettingsScene}
        options={{
          headerTitle: props => <CurrencySettingsTitle />,
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="defaultFiatSetting"
        component={DefaultFiatSettingScene}
        options={{
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="edgeLogin" component={EdgeLoginScene} />
      <AppStack.Screen
        name="editToken"
        component={EditTokenScene}
        options={{
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="swapSettings"
        component={SwapSettingsScene}
        options={{
          title: lstrings.settings_exchange_settings,
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="swapSuccess"
        component={SwapSuccessScene}
        options={{
          headerLeft: () => null
        }}
      />
      <AppStack.Screen
        name="extraTab"
        component={ExtraTabScene}
        options={{
          headerLeft: () => <HeaderTextButton type="help" />
        }}
      />
      <AppStack.Screen
        name="earnScene"
        component={EarnScene}
        options={{
          title: getUkCompliantString(countryCode, 'stake_earn_button_label')
        }}
      />
      <AppStack.Screen name="fioAddressDetails" component={FioAddressDetailsScene} />
      <AppStack.Screen name="fioAddressList" component={FioAddressListScene} />
      <AppStack.Screen name="fioAddressRegister" component={FioAddressRegisterScene} />
      <AppStack.Screen
        name="fioAddressRegisterSelectWallet"
        component={FioAddressRegisterSelectWalletScene}
        options={{
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="fioAddressRegisterSuccess"
        component={FioAddressRegisteredScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'fioAddressRegisterSuccess'> fromParams={params => params.fioName} />,
          headerLeft: () => null
        }}
      />
      <AppStack.Screen name="fioAddressSettings" component={FioAddressSettingsScene} />
      <AppStack.Screen name="fioConnectToWalletsConfirm" component={FioConnectWalletConfirmScene} />
      <AppStack.Screen
        name="fioCreateHandle"
        component={FioCreateHandleScene}
        options={{
          title: lstrings.fio_free_handle_title
        }}
      />
      <AppStack.Screen
        name="fioDomainConfirm"
        component={FioNameConfirmScene}
        options={{
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="fioDomainRegister" component={FioDomainRegisterScene} />
      <AppStack.Screen
        name="fioDomainRegisterSelectWallet"
        component={FioDomainRegisterSelectWalletScene}
        options={{
          title: lstrings.title_register_fio_domain,
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="fioDomainSettings" component={FioDomainSettingsScene} />
      <AppStack.Screen
        name="fioNameConfirm"
        component={FioNameConfirmScene}
        options={{
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="fioRequestConfirmation" component={FioRequestConfirmationScene} />
      <AppStack.Screen name="fioRequestList" component={FioRequestListScene} />
      <AppStack.Screen
        name="fioSentRequestDetails"
        component={FioSentRequestDetailsScene}
        options={{
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="fioStakingChange" component={FioStakingChangeScene} />
      <AppStack.Screen name="fioStakingOverview" component={FioStakingOverviewScene} />
      <AppStack.Screen name="loanClose" component={LoanCloseScene} />
      <AppStack.Screen name="loanCreate" component={LoanCreateScene} />
      <AppStack.Screen name="loanCreateConfirmation" component={LoanCreateConfirmationScene} />
      <AppStack.Screen name="loanDashboard" component={LoanDashboardScene} />
      <AppStack.Screen name="loanDetails" component={LoanDetailsScene} />
      <AppStack.Screen name="loanManage" component={LoanManageScene} />
      <AppStack.Screen name="loanStatus" component={LoanStatusScene} />
      <AppStack.Screen
        name="manageTokens"
        component={ManageTokensScene}
        options={{
          headerRight: () => null
        }}
      />

      <AppStack.Screen name="sweepPrivateKeyProcessing" component={SweepPrivateKeyProcessingScene} />
      <AppStack.Screen name="sweepPrivateKeySelectCrypto" component={SweepPrivateKeySelectCryptoScene} />
      <AppStack.Screen name="sweepPrivateKeyCalculateFee" component={SweepPrivateKeyCalculateFeeScene} />
      <AppStack.Screen
        name="sweepPrivateKeyCompletion"
        component={SweepPrivateKeyCompletionScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="migrateWalletCalculateFee" component={MigrateWalletCalculateFeeScene} />
      <AppStack.Screen
        name="migrateWalletCompletion"
        component={MigrateWalletCompletionScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="migrateWalletSelectCrypto" component={MigrateWalletSelectCryptoScene} />
      <AppStack.Screen
        name="notificationSettings"
        component={NotificationScene}
        options={{
          title: lstrings.settings_notifications,
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="otpRepair" component={OtpRepairScene} options={{ headerShown: false }} />
      <AppStack.Screen
        name="otpSetup"
        component={OtpSettingsScene}
        options={{
          title: lstrings.title_otp,
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="passwordRecovery"
        component={ChangeRecoveryScene}
        options={{
          title: lstrings.title_password_recovery,
          headerRight: () => null
        }}
      />
      <AppStack.Screen
        name="upgradeUsername"
        component={UpgradeUsernameScene}
        options={{
          headerShown: false
        }}
      />
      <AppStack.Screen
        name="pluginView"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginView'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <AppStack.Screen
        name="promotionSettings"
        component={PromotionSettingsScene}
        options={{
          title: lstrings.title_promotion_settings,
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="request" component={RequestScene} />
      <AppStack.Screen name="securityAlerts" component={SecurityAlertsScene} options={{ headerShown: false }} />
      <AppStack.Screen name="send2" component={SendScene2} />
      <AppStack.Screen
        name="settingsOverview"
        component={SettingsScene}
        options={{
          title: lstrings.title_settings
        }}
      />
      <AppStack.Screen
        name="spendingLimits"
        component={SpendingLimitsScene}
        options={{
          title: lstrings.spending_limits,
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="stakeModify" component={StakeModifyScene} />
      <AppStack.Screen name="stakeOptions" component={StakeOptionsScene} />
      <AppStack.Screen name="stakeOverview" component={StakeOverviewScene} />
      <AppStack.Screen
        name="transactionDetails"
        component={TransactionDetailsScene}
        options={{
          headerTitle: () => <TransactionDetailsTitle />
        }}
      />
      <AppStack.Screen
        name="transactionsExport"
        component={TransactionsExportScene}
        options={{
          title: lstrings.title_export_transactions,
          headerRight: () => null
        }}
      />
      <AppStack.Screen name="walletRestore" component={WalletRestoreScene} />
      <AppStack.Screen name="wcConnect" component={WcConnectScene} />
      <AppStack.Screen name="wcConnections" component={WcConnectionsScene} />
      <AppStack.Screen name="wcDisconnect" component={WcDisconnectScene} />
      <AppStack.Screen
        name="webView"
        component={WebViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'webView'> fromParams={params => params.title} />
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
      drawerContent={props => SideMenu(props)}
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
