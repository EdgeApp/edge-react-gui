import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { HeaderTitleProps } from '@react-navigation/elements'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack'
import * as React from 'react'
import { AirshipToast } from 'react-native-airship'
import { useDispatch } from 'react-redux'

import { checkEnabledExchanges } from '../actions/CryptoExchangeActions'
import { logout } from '../actions/LoginActions'
import { showReEnableOtpModal } from '../actions/SettingsActions'
import { CryptoExchangeScene as CryptoExchangeSceneComponent } from '../components/scenes/CryptoExchangeScene'
import { ENV } from '../env'
import { useMount } from '../hooks/useMount'
import { useUnmount } from '../hooks/useUnmount'
import { lstrings } from '../locales/strings'
import { AddressFormScene } from '../plugins/gui/scenes/AddressFormScene'
import { FiatPluginEnterAmountScene as FiatPluginEnterAmountSceneComponent } from '../plugins/gui/scenes/FiatPluginEnterAmountScene'
import { InfoDisplayScene } from '../plugins/gui/scenes/InfoDisplayScene'
import { RewardsCardDashboardScene as RewardsCardListSceneComponent } from '../plugins/gui/scenes/RewardsCardDashboardScene'
import { RewardsCardWelcomeScene as RewardsCardWelcomeSceneComponent } from '../plugins/gui/scenes/RewardsCardWelcomeScene'
import { SepaFormScene } from '../plugins/gui/scenes/SepaFormScene'
import { defaultAccount } from '../reducers/CoreReducer'
import { useSelector } from '../types/reactRedux'
import { AppParamList } from '../types/routerTypes'
import { logEvent } from '../util/tracking'
import { ifLoggedIn } from './hoc/IfLoggedIn'
import { useBackEvent } from './hoc/useBackEvent'
import { BackButton } from './navigation/BackButton'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle'
import { EdgeLogoHeader } from './navigation/EdgeLogoHeader'
import { PluginBackButton } from './navigation/GuiPluginBackButton'
import { HeaderTextButton } from './navigation/HeaderTextButton'
import { HeaderTitle } from './navigation/HeaderTitle'
import { ParamHeaderTitle } from './navigation/ParamHeaderTitle'
import { SideMenuButton } from './navigation/SideMenuButton'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle'
import { ChangeMiningFeeScene as ChangeMiningFeeSceneComponent } from './scenes/ChangeMiningFeeScene'
import { ChangeMiningFeeScene2 as ChangeMiningFeeScene2Component } from './scenes/ChangeMiningFeeScene2'
import { ChangePasswordScene as ChangePasswordSceneComponent } from './scenes/ChangePasswordScene'
import { ChangePinScene as ChangePinSceneComponent } from './scenes/ChangePinScene'
import { CoinRankingDetailsScene as CoinRankingDetailsSceneComponent } from './scenes/CoinRankingDetailsScene'
import { CoinRankingScene as CoinRankingSceneComponent } from './scenes/CoinRankingScene'
import { ConfirmScene as ConfirmSceneComponent } from './scenes/ConfirmScene'
import { CreateWalletAccountSelectScene as CreateWalletAccountSelectSceneComponent } from './scenes/CreateWalletAccountSelectScene'
import { CreateWalletAccountSetupScene as CreateWalletAccountSetupSceneComponent } from './scenes/CreateWalletAccountSetupScene'
import { CreateWalletCompletionScene as CreateWalletCompletionSceneComponent } from './scenes/CreateWalletCompletionScene'
import { CreateWalletImportOptionsScene as CreateWalletImportOptionsSceneComponent } from './scenes/CreateWalletImportOptionsScene'
import { CreateWalletImportScene as CreateWalletImportSceneComponent } from './scenes/CreateWalletImportScene'
import { CreateWalletSelectCryptoScene as CreateWalletSelectCryptoSceneComponent } from './scenes/CreateWalletSelectCryptoScene'
import { CreateWalletSelectFiatScene as CreateWalletSelectFiatSceneComponent } from './scenes/CreateWalletSelectFiatScene'
import { CryptoExchangeQuoteProcessingScreen as CryptoExchangeQuoteProcessingScreenComponent } from './scenes/CryptoExchangeQuoteProcessingScene'
import { CryptoExchangeQuote as CryptoExchangeQuoteComponent } from './scenes/CryptoExchangeQuoteScene'
import { CryptoExchangeSuccessScene as CryptoExchangeSuccessSceneComponent } from './scenes/CryptoExchangeSuccessScene'
import { CurrencyNotificationScene as CurrencyNotificationSceneComponent } from './scenes/CurrencyNotificationScene'
import { CurrencySettingsScene as CurrencySettingsSceneComponent } from './scenes/CurrencySettingsScene'
import { DefaultFiatSettingScene as DefaultFiatSettingSceneComponent } from './scenes/DefaultFiatSettingScene'
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
import { SendScene as SendSceneComponent } from './scenes/SendScene'
import { SendScene2 as SendScene2Component } from './scenes/SendScene2'
import { SettingsScene as SettingsSceneComponent } from './scenes/SettingsScene'
import { SpendingLimitsScene as SpendingLimitsSceneComponent } from './scenes/SpendingLimitsScene'
import { StakeModifyScene as StakeModifySceneComponent } from './scenes/Staking/StakeModifyScene'
import { StakeOptionsScene as StakeOptionsSceneComponent } from './scenes/Staking/StakeOptionsScene'
import { StakeOverviewScene as StakeOverviewSceneComponent } from './scenes/Staking/StakeOverviewScene'
import { SwapSettingsScene as SwapSettingsSceneComponent } from './scenes/SwapSettingsScene'
import { TermsOfServiceComponent as TermsOfServiceComponentComponent } from './scenes/TermsOfServiceScene'
import { TransactionDetailsScene as TransactionDetailsSceneComponent } from './scenes/TransactionDetailsScene'
import { TransactionList as TransactionListComponent } from './scenes/TransactionListScene'
import { TransactionsExportScene as TransactionsExportSceneComponent } from './scenes/TransactionsExportScene'
import { WalletListScene as WalletListSceneComponent } from './scenes/WalletListScene'
import { WcConnectionsScene as WcConnectionsSceneComponent } from './scenes/WcConnectionsScene'
import { WcConnectScene as WcConnectSceneComponent } from './scenes/WcConnectScene'
import { WcDisconnectScene as WcDisconnectSceneComponent } from './scenes/WcDisconnectScene'
import { Airship } from './services/AirshipInstance'
import { useTheme } from './services/ThemeContext'
import { ControlPanel as ControlPanelComponent } from './themed/ControlPanel'
import { MenuTabs } from './themed/MenuTabs'

const ChangeMiningFeeScene = ifLoggedIn(ChangeMiningFeeSceneComponent)
const ChangeMiningFeeScene2 = ifLoggedIn(ChangeMiningFeeScene2Component)
const ChangePasswordScene = ifLoggedIn(ChangePasswordSceneComponent)
const ChangePinScene = ifLoggedIn(ChangePinSceneComponent)
const ChangeRecoveryScene = ifLoggedIn(ChangeRecoverySceneComponent)
const CoinRankingDetailsScene = ifLoggedIn(CoinRankingDetailsSceneComponent)
const CoinRankingScene = ifLoggedIn(CoinRankingSceneComponent)
const ConfirmScene = ifLoggedIn(ConfirmSceneComponent)
const ControlPanel = ifLoggedIn(ControlPanelComponent)
const CreateWalletAccountSelectScene = ifLoggedIn(CreateWalletAccountSelectSceneComponent)
const CreateWalletAccountSetupScene = ifLoggedIn(CreateWalletAccountSetupSceneComponent)
const CreateWalletCompletionScene = ifLoggedIn(CreateWalletCompletionSceneComponent)
const CreateWalletImportScene = ifLoggedIn(CreateWalletImportSceneComponent)
const CreateWalletImportOptionsScene = ifLoggedIn(CreateWalletImportOptionsSceneComponent)
const CreateWalletSelectCryptoScene = ifLoggedIn(CreateWalletSelectCryptoSceneComponent)
const CreateWalletSelectFiatScene = ifLoggedIn(CreateWalletSelectFiatSceneComponent)
const CryptoExchangeQuote = ifLoggedIn(CryptoExchangeQuoteComponent)
const CryptoExchangeQuoteProcessingScreen = ifLoggedIn(CryptoExchangeQuoteProcessingScreenComponent)
const CryptoExchangeScene = ifLoggedIn(CryptoExchangeSceneComponent)
const CryptoExchangeSuccessScene = ifLoggedIn(CryptoExchangeSuccessSceneComponent)
const CurrencyNotificationScene = ifLoggedIn(CurrencyNotificationSceneComponent)
const CurrencySettingsScene = ifLoggedIn(CurrencySettingsSceneComponent)
const DefaultFiatSettingScene = ifLoggedIn(DefaultFiatSettingSceneComponent)
const EdgeLoginScene = ifLoggedIn(EdgeLoginSceneComponent)
const EditTokenScene = ifLoggedIn(EditTokenSceneComponent)
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
const MigrateWalletCalculateFeeScene = ifLoggedIn(MigrateWalletCalculateFeeSceneComponent)
const MigrateWalletCompletionScene = ifLoggedIn(MigrateWalletCompletionSceneComponent)
const MigrateWalletSelectCryptoScene = ifLoggedIn(MigrateWalletSelectCryptoSceneComponent)
const NotificationScene = ifLoggedIn(NotificationSceneComponent)
const OtpRepairScene = ifLoggedIn(OtpRepairSceneComponent)
const OtpSettingsScene = ifLoggedIn(OtpSettingsSceneComponent)
const PromotionSettingsScene = ifLoggedIn(PromotionSettingsSceneComponent)
const RequestScene = ifLoggedIn(RequestSceneComponent)
const SecurityAlertsScene = ifLoggedIn(SecurityAlertsSceneComponent)
const SendScene = ifLoggedIn(SendSceneComponent)
const SendScene2 = ifLoggedIn(SendScene2Component)
const SettingsScene = ifLoggedIn(SettingsSceneComponent)
const SpendingLimitsScene = ifLoggedIn(SpendingLimitsSceneComponent)
const RewardsCardDashboardScene = ifLoggedIn(RewardsCardListSceneComponent)
const RewardsCardWelcomeScene = ifLoggedIn(RewardsCardWelcomeSceneComponent)
const StakeModifyScene = ifLoggedIn(StakeModifySceneComponent)
const StakeOptionsScene = ifLoggedIn(StakeOptionsSceneComponent)
const StakeOverviewScene = ifLoggedIn(StakeOverviewSceneComponent)
const SwapSettingsScene = ifLoggedIn(SwapSettingsSceneComponent)
const TermsOfServiceComponent = ifLoggedIn(TermsOfServiceComponentComponent)
const TransactionDetailsScene = ifLoggedIn(TransactionDetailsSceneComponent)
const TransactionList = ifLoggedIn(TransactionListComponent)
const TransactionsExportScene = ifLoggedIn(TransactionsExportSceneComponent)
const WalletListScene = ifLoggedIn(WalletListSceneComponent)
const WcConnectionsScene = ifLoggedIn(WcConnectionsSceneComponent)
const WcConnectScene = ifLoggedIn(WcConnectSceneComponent)
const WcDisconnectScene = ifLoggedIn(WcDisconnectSceneComponent)

const Drawer = createDrawerNavigator<AppParamList>()
const Stack = createStackNavigator<AppParamList>()
const Tab = createBottomTabNavigator<AppParamList>()

const defaultScreenOptions: StackNavigationOptions = {
  title: '',
  headerTitle: ({ children }: HeaderTitleProps) => <HeaderTitle title={children} />,
  headerLeft: () => <BackButton />,
  headerRight: () => <SideMenuButton />,
  headerShown: true,
  headerTitleAlign: 'center',
  headerTransparent: true
}
const firstSceneScreenOptions: StackNavigationOptions = {
  headerLeft: () => <HeaderTextButton type="help" />,
  headerTitle: EdgeLogoHeader,
  headerTitleAlign: 'center'
}

export const Main = () => {
  const theme = useTheme()
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

  React.useEffect(() => {
    logEvent('Start_App')
  }, [])

  return (
    <NavigationContainer theme={reactNavigationTheme}>
      <Stack.Navigator
        initialRouteName={ENV.USE_WELCOME_SCREENS ? 'gettingStarted' : 'login'}
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="edgeApp" component={EdgeApp} />
        <Stack.Screen name="gettingStarted" component={GettingStartedScene} />
        <Stack.Screen name="login" component={LoginScene} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const EdgeApp = () => {
  const backPressedOnce = React.useRef(false)
  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)

  useBackEvent(() => {
    // Allow back if logged out or this is the second back press
    if (account === defaultAccount || backPressedOnce.current) {
      return true
    }
    backPressedOnce.current = true
    Airship.show(bridge => <AirshipToast bridge={bridge} message={lstrings.back_button_tap_again_to_exit} />).then(() => {
      backPressedOnce.current = false
    })
    // Timeout the back press after 3 seconds so the state isn't "sticky"
    setTimeout(() => {
      backPressedOnce.current = false
    }, 3000)
    return false
  })

  // Login/Logout events:
  useMount(() => {
    dispatch({ type: 'IS_LOGGED_IN' })
  })
  useUnmount(() => {
    dispatch(logout())
  })

  return (
    <Drawer.Navigator
      drawerContent={props => ControlPanel(props)}
      initialRouteName="edgeAppStack"
      screenOptions={{
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: { backgroundColor: 'transparent', bottom: 0 },
        headerShown: false
      }}
    >
      <Drawer.Screen name="edgeAppStack" component={EdgeAppStack} />
    </Drawer.Navigator>
  )
}

const EdgeAppStack = () => {
  const dispatch = useDispatch()

  return (
    <Stack.Navigator initialRouteName="edgeTabs" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="edgeTabs"
        component={EdgeTabs}
        options={{
          headerShown: false
        }}
      />

      <Stack.Screen
        name="changeMiningFee"
        component={ChangeMiningFeeScene}
        options={{
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen
        name="changeMiningFee2"
        component={ChangeMiningFeeScene2}
        options={{
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen
        name="changePassword"
        component={ChangePasswordScene}
        options={{
          title: lstrings.title_change_password,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="changePin"
        component={ChangePinScene}
        options={{
          title: lstrings.title_change_pin,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="coinRankingDetails"
        component={CoinRankingDetailsScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen name="confirmScene" component={ConfirmScene} />
      <Stack.Screen
        name="createWalletAccountSelect"
        component={CreateWalletAccountSelectScene}
        options={{
          title: lstrings.create_wallet_account_activate,
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen
        name="createWalletAccountSetup"
        component={CreateWalletAccountSetupScene}
        options={{
          title: lstrings.create_wallet_create_account,
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen
        name="createWalletCompletion"
        component={CreateWalletCompletionScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="createWalletImport"
        component={CreateWalletImportScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="createWalletImportOptions"
        component={CreateWalletImportOptionsScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="createWalletSelectCrypto" component={CreateWalletSelectCryptoScene} />
      <Stack.Screen name="createWalletSelectFiat" component={CreateWalletSelectFiatScene} />
      <Stack.Screen
        name="currencyNotificationSettings"
        component={CurrencyNotificationScene}
        options={{
          headerTitle: props => <CurrencySettingsTitle />,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="currencySettings"
        component={CurrencySettingsScene}
        options={{
          headerTitle: props => <CurrencySettingsTitle />,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="defaultFiatSetting"
        component={DefaultFiatSettingScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="edgeLogin" component={EdgeLoginScene} />
      <Stack.Screen
        name="editToken"
        component={EditTokenScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="exchangeSettings"
        // @ts-expect-error-error
        component={SwapSettingsScene}
        options={{
          title: lstrings.settings_exchange_settings,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="exchangeSuccess"
        component={CryptoExchangeSuccessScene}
        options={{
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="extraTab"
        component={ExtraTabScene}
        options={{
          headerLeft: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen
        name="fioAddressDetails"
        component={FioAddressDetailsScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'fioAddressDetails'> fromParams={params => params.fioAddressName} />
        }}
      />
      <Stack.Screen name="fioAddressList" component={FioAddressListScene} />
      <Stack.Screen
        name="fioAddressRegister"
        component={FioAddressRegisterScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="fioAddressRegisterSelectWallet"
        component={FioAddressRegisterSelectWalletScene}
        options={{
          title: lstrings.title_fio_address_confirmation,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="fioAddressRegisterSuccess"
        component={FioAddressRegisteredScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'fioAddressRegisterSuccess'> fromParams={params => params.fioName} />,
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="fioAddressSettings"
        component={FioAddressSettingsScene}
        options={{
          title: lstrings.title_fio_address_settings
        }}
      />
      <Stack.Screen
        name="fioConnectToWalletsConfirm"
        component={FioConnectWalletConfirmScene}
        options={{
          title: lstrings.title_fio_connect_to_wallet
        }}
      />
      <Stack.Screen
        name="fioCreateHandle"
        component={FioCreateHandleScene}
        options={{
          title: lstrings.fio_free_handle_title
        }}
      />
      <Stack.Screen
        name="fioDomainConfirm"
        component={FioNameConfirmScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="fioDomainRegister"
        component={FioDomainRegisterScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="fioDomainRegisterSelectWallet"
        component={FioDomainRegisterSelectWalletScene}
        options={{
          title: lstrings.title_register_fio_domain,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="fioDomainSettings"
        component={FioDomainSettingsScene}
        options={{
          title: lstrings.title_fio_domain_settings
        }}
      />
      <Stack.Screen
        name="fioNameConfirm"
        component={FioNameConfirmScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="fioRequestConfirmation"
        component={FioRequestConfirmationScene}
        options={{
          title: lstrings.fio_confirm_request_header
        }}
      />
      <Stack.Screen name="fioRequestList" component={FioRequestListScene} />
      <Stack.Screen
        name="fioSentRequestDetails"
        component={FioSentRequestDetailsScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="fioStakingChange" component={FioStakingChangeScene} />
      <Stack.Screen name="fioStakingOverview" component={FioStakingOverviewScene} />
      <Stack.Screen
        name="guiPluginEnterAmount"
        component={FiatPluginEnterAmountScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="guiPluginAddressForm"
        component={AddressFormScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="guiPluginSepaForm"
        component={SepaFormScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="guiPluginInfoDisplay"
        component={InfoDisplayScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="loanClose"
        component={LoanCloseScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanCreate"
        component={LoanCreateScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanCreateConfirmation"
        component={LoanCreateConfirmationScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanDashboard"
        component={LoanDashboardScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanDetails"
        // @ts-expect-error
        component={LoanDetailsScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanManage"
        component={LoanManageScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen name="loanStatus" component={LoanStatusScene} />
      <Stack.Screen
        name="manageTokens"
        // @ts-expect-error
        component={ManageTokensScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="migrateWalletCalculateFee" component={MigrateWalletCalculateFeeScene} />
      <Stack.Screen
        name="migrateWalletCompletion"
        component={MigrateWalletCompletionScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="migrateWalletSelectCrypto" component={MigrateWalletSelectCryptoScene} />
      <Stack.Screen
        name="notificationSettings"
        component={NotificationScene}
        options={{
          title: lstrings.settings_notifications,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="otpRepair" component={OtpRepairScene} options={{ headerShown: false }} />
      <Stack.Screen
        name="otpSetup"
        component={OtpSettingsScene}
        options={{
          title: lstrings.title_otp,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="passwordRecovery"
        component={ChangeRecoveryScene}
        options={{
          title: lstrings.title_password_recovery,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="pluginView"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginView'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <Stack.Screen
        name="pluginViewBuy"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewBuy'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <Stack.Screen
        name="pluginViewSell"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewSell'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <Stack.Screen
        name="promotionSettings"
        component={PromotionSettingsScene}
        options={{
          title: lstrings.title_promotion_settings,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="request"
        component={RequestScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen name="securityAlerts" component={SecurityAlertsScene} options={{ headerShown: false }} />
      <Stack.Screen name="send" component={SendScene} />
      <Stack.Screen name="send2" component={SendScene2} />
      <Stack.Screen
        name="settingsOverview"
        component={SettingsScene}
        options={{
          title: lstrings.title_settings
        }}
        listeners={{
          focus: () => dispatch(showReEnableOtpModal())
        }}
      />
      <Stack.Screen
        name="spendingLimits"
        component={SpendingLimitsScene}
        options={{
          title: lstrings.spending_limits,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="stakeModify" component={StakeModifyScene} />
      <Stack.Screen name="stakeOptions" component={StakeOptionsScene} />
      <Stack.Screen name="stakeOverview" component={StakeOverviewScene} />
      <Stack.Screen
        name="termsOfService"
        component={TermsOfServiceComponent}
        options={{
          title: lstrings.title_terms_of_service
        }}
      />
      <Stack.Screen
        name="transactionDetails"
        component={TransactionDetailsScene}
        options={{
          headerTitle: () => <TransactionDetailsTitle />
        }}
      />
      <Stack.Screen
        name="transactionsExport"
        component={TransactionsExportScene}
        options={{
          title: lstrings.title_export_transactions,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="wcConnect" component={WcConnectScene} />
      <Stack.Screen name="wcConnections" component={WcConnectionsScene} />
      <Stack.Screen name="wcDisconnect" component={WcDisconnectScene} />
    </Stack.Navigator>
  )
}

const EdgeTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="walletsTab"
      tabBar={props => <MenuTabs {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tab.Screen name="walletsTab" component={EdgeWalletsTabScreen} />
      <Tab.Screen name="buyTab" component={EdgeBuyTabScreen} />
      <Tab.Screen name="sellTab" component={EdgeSellTabScreen} />
      <Tab.Screen name="exchangeTab" component={EdgeExchangeTabScreen} />
      <Tab.Screen name="marketsTab" component={EdgeMarketsTabScreen} />
      <Tab.Screen name="extraTab" component={ExtraTabScene} />
    </Tab.Navigator>
  )
}

const EdgeWalletsTabScreen = () => {
  return (
    <Stack.Navigator initialRouteName="walletList" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="transactionDetails"
        component={TransactionDetailsScene}
        options={{
          headerTitle: () => <TransactionDetailsTitle />
        }}
      />
      <Stack.Screen name="transactionList" component={TransactionList} />
      <Stack.Screen name="walletList" component={WalletListScene} options={firstSceneScreenOptions} />
    </Stack.Navigator>
  )
}

const EdgeBuyTabScreen = () => {
  return (
    <Stack.Navigator initialRouteName="pluginListBuy" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="guiPluginEnterAmount"
        component={FiatPluginEnterAmountScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="pluginListBuy" component={GuiPluginListScene} options={firstSceneScreenOptions} />
      <Stack.Screen
        name="pluginViewBuy"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewBuy'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
    </Stack.Navigator>
  )
}

const EdgeSellTabScreen = () => {
  return (
    <Stack.Navigator initialRouteName="pluginListSell" screenOptions={defaultScreenOptions}>
      <Stack.Screen name="guiPluginEnterAmount" component={FiatPluginEnterAmountScene} />
      <Stack.Screen name="pluginListSell" component={GuiPluginListScene} options={firstSceneScreenOptions} />
      <Stack.Screen
        name="rewardsCardDashboard"
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
        component={RewardsCardDashboardScene}
      />
      <Stack.Screen
        name="rewardsCardWelcome"
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
        component={RewardsCardWelcomeScene}
      />
      <Stack.Screen
        name="pluginViewSell"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewSell'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
    </Stack.Navigator>
  )
}

const EdgeExchangeTabScreen = () => {
  const dispatch = useDispatch()
  return (
    <Stack.Navigator initialRouteName="exchange" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="exchange"
        component={CryptoExchangeScene}
        options={firstSceneScreenOptions}
        listeners={{
          focus: () => dispatch(checkEnabledExchanges())
        }}
      />
      <Stack.Screen name="exchangeQuote" component={CryptoExchangeQuote} />
      <Stack.Screen
        name="exchangeQuoteProcessing"
        component={CryptoExchangeQuoteProcessingScreen}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
    </Stack.Navigator>
  )
}

const EdgeMarketsTabScreen = () => {
  const dispatch = useDispatch()
  return (
    <Stack.Navigator initialRouteName="coinRanking" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="coinRanking"
        component={CoinRankingScene}
        options={firstSceneScreenOptions}
        listeners={{
          focus: () => dispatch(checkEnabledExchanges())
        }}
      />
      <Stack.Screen
        name="coinRankingDetails"
        component={CoinRankingDetailsScene}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
    </Stack.Navigator>
  )
}
