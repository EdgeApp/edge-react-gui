import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { HeaderTitleProps } from '@react-navigation/elements'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import * as React from 'react'
import { AirshipToast } from 'react-native-airship'
import { useDispatch } from 'react-redux'

import { checkEnabledExchanges } from '../actions/CryptoExchangeActions'
import { logoutRequest } from '../actions/LoginActions'
import { showReEnableOtpModal } from '../actions/SettingsActions'
import { CryptoExchangeScene } from '../components/scenes/CryptoExchangeScene'
import { useMount } from '../hooks/useMount'
import { useUnmount } from '../hooks/useUnmount'
import s from '../locales/strings'
import { FiatPluginEnterAmountScene } from '../plugins/gui/scenes/EnterAmountScene'
import { AppParamList, NavigationBase } from '../types/routerTypes'
import { logEvent } from '../util/tracking'
import { ifLoggedIn } from './hoc/IfLoggedIn'
import { useBackEvent } from './hoc/useBackEvent'
import { withServices } from './hoc/withServices'
import { BackButton } from './navigation/BackButton'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle'
import { EdgeLogoHeader } from './navigation/EdgeLogoHeader'
import { PluginBackButton } from './navigation/GuiPluginBackButton'
import { HeaderTextButton } from './navigation/HeaderTextButton'
import { HeaderTitle } from './navigation/HeaderTitle'
import { ParamHeaderTitle } from './navigation/ParamHeaderTitle'
import { SideMenuButton } from './navigation/SideMenuButton'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle'
import { ChangeMiningFeeScene } from './scenes/ChangeMiningFeeScene'
import { ChangeMiningFeeScene2 } from './scenes/ChangeMiningFeeScene2'
import { ChangePasswordScene } from './scenes/ChangePasswordScene'
import { ChangePinScene } from './scenes/ChangePinScene'
import { CoinRankingDetailsScene } from './scenes/CoinRankingDetailsScene'
import { CoinRankingScene } from './scenes/CoinRankingScene'
import { ConfirmScene } from './scenes/ConfirmScene'
import { CreateWalletAccountSelectScene } from './scenes/CreateWalletAccountSelectScene'
import { CreateWalletAccountSetupScene } from './scenes/CreateWalletAccountSetupScene'
import { CreateWalletCompletionScene } from './scenes/CreateWalletCompletionScene'
import { CreateWalletImportScene } from './scenes/CreateWalletImportScene'
import { CreateWalletSelectCryptoScene } from './scenes/CreateWalletSelectCryptoScene'
import { CreateWalletSelectFiatScene } from './scenes/CreateWalletSelectFiatScene'
import { CryptoExchangeQuoteProcessingScreen } from './scenes/CryptoExchangeQuoteProcessingScene'
import { CryptoExchangeQuote } from './scenes/CryptoExchangeQuoteScene'
import { CryptoExchangeSuccessScene } from './scenes/CryptoExchangeSuccessScene'
import { CurrencyNotificationScene } from './scenes/CurrencyNotificationScene'
import { CurrencySettingsScene } from './scenes/CurrencySettingsScene'
import { DefaultFiatSettingScene } from './scenes/DefaultFiatSettingScene'
import { EditTokenScene } from './scenes/EditTokenScene'
import { ExtraTabScene } from './scenes/ExtraTabScene'
import { FioAddressDetailsScene } from './scenes/FioAddressDetailsScene'
import { FioAddressListScene } from './scenes/FioAddressListScene'
import { FioAddressRegisteredScene } from './scenes/FioAddressRegisteredScene'
import { FioAddressRegisterScene } from './scenes/FioAddressRegisterScene'
import { FioAddressRegisterSelectWalletScene } from './scenes/FioAddressRegisterSelectWalletScene'
import { FioAddressSettingsScene } from './scenes/FioAddressSettingsScene'
import { FioConnectWalletConfirmScene } from './scenes/FioConnectWalletConfirmScene'
import { FioDomainRegisterScene } from './scenes/FioDomainRegisterScene'
import { FioDomainRegisterSelectWalletScene } from './scenes/FioDomainRegisterSelectWalletScene'
import { FioDomainSettingsScene } from './scenes/FioDomainSettingsScene'
import { FioNameConfirmScene } from './scenes/FioNameConfirmScene'
import { FioRequestConfirmationScene } from './scenes/FioRequestConfirmationScene'
import { FioRequestListScene } from './scenes/FioRequestListScene'
import { FioSentRequestDetailsScene } from './scenes/FioSentRequestDetailsScene'
import { FioStakingChangeScene } from './scenes/FioStakingChangeScene'
import { FioStakingOverviewScene } from './scenes/FioStakingOverviewScene'
import { GuiPluginListScene } from './scenes/GuiPluginListScene'
import { GuiPluginViewScene } from './scenes/GuiPluginViewScene'
import { LoanCloseScene } from './scenes/Loans/LoanCloseScene'
import { LoanCreateConfirmationScene } from './scenes/Loans/LoanCreateConfirmationScene'
import { LoanCreateScene } from './scenes/Loans/LoanCreateScene'
import { LoanDashboardScene } from './scenes/Loans/LoanDashboardScene'
import { LoanDetailsScene } from './scenes/Loans/LoanDetailsScene'
import { LoanManageScene } from './scenes/Loans/LoanManageScene'
import { LoanStatusScene } from './scenes/Loans/LoanStatusScene'
import { LoginScene } from './scenes/LoginScene'
import { ManageTokensScene } from './scenes/ManageTokensScene'
import { NotificationScene } from './scenes/NotificationScene'
import { OtpSettingsScene } from './scenes/OtpSettingsScene'
import { ChangeRecoveryScene } from './scenes/PasswordRecoveryScene'
import { PromotionSettingsScene } from './scenes/PromotionSettingsScene'
import { RequestScene } from './scenes/RequestScene'
import { SendScene } from './scenes/SendScene'
import { SendScene2 } from './scenes/SendScene2'
import { SettingsScene } from './scenes/SettingsScene'
import { SpendingLimitsScene } from './scenes/SpendingLimitsScene'
import { StakeModifyScene } from './scenes/Staking/StakeModifyScene'
import { StakeOptionsScene } from './scenes/Staking/StakeOptionsScene'
import { StakeOverviewScene } from './scenes/Staking/StakeOverviewScene'
import { SwapSettingsScene } from './scenes/SwapSettingsScene'
import { TermsOfServiceComponent } from './scenes/TermsOfServiceScene'
import { TransactionDetailsScene } from './scenes/TransactionDetailsScene'
import { TransactionList } from './scenes/TransactionListScene'
import { TransactionsExportScene } from './scenes/TransactionsExportScene'
import { WalletListScene } from './scenes/WalletListScene'
import { WcConnectionsScene } from './scenes/WcConnectionsScene'
import { WcConnectScene } from './scenes/WcConnectScene'
import { WcDisconnectScene } from './scenes/WcDisconnectScene'
import { Airship, showError } from './services/AirshipInstance'
import { requestPermission } from './services/PermissionsManager'
import { ControlPanel } from './themed/ControlPanel'
import { MenuTabs } from './themed/MenuTabs'

const Drawer = createDrawerNavigator<AppParamList>()
const Stack = createStackNavigator<AppParamList>()
const Tab = createBottomTabNavigator<AppParamList>()

export const Main = () => {
  React.useEffect(() => {
    logEvent('Start_App')
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="login"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="login" component={withServices(LoginScene)} />
        <Stack.Screen name="edgeApp" component={EdgeApp} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const EdgeApp = () => {
  const backPressedOnce = React.useRef(false)
  const dispatch = useDispatch()
  const navigation = useNavigation<NavigationBase>()

  useBackEvent(() => {
    if (backPressedOnce.current) {
      return true
    } else {
      backPressedOnce.current = true
      Airship.show(bridge => <AirshipToast bridge={bridge} message={s.strings.back_button_tap_again_to_exit} />).then(() => {
        backPressedOnce.current = false
      })
      // Timeout the back press after 3 seconds so the state isn't "sticky"
      setTimeout(() => {
        backPressedOnce.current = false
      }, 3000)
      return false
    }
  })

  // Login/Logout events:
  useMount(() => {
    dispatch({ type: 'IS_LOGGED_IN' })
  })
  useUnmount(() => {
    dispatch(logoutRequest(navigation))
  })

  return (
    <Drawer.Navigator
      drawerContent={props => ifLoggedIn(ControlPanel)(props)}
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
    <Stack.Navigator
      initialRouteName="edgeTabs"
      screenOptions={{
        title: '',
        headerTitle: ({ children }: HeaderTitleProps) => <HeaderTitle title={children} />,
        headerLeft: () => <BackButton />,
        headerRight: () => <SideMenuButton />,
        headerShown: true,
        headerTransparent: true
      }}
    >
      <Stack.Screen
        name="edgeTabs"
        component={EdgeTabs}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen name="confirmScene" component={ifLoggedIn(ConfirmScene)} />
      <Stack.Screen name="createWalletSelectCrypto" component={ifLoggedIn(CreateWalletSelectCryptoScene)} />
      <Stack.Screen name="createWalletSelectFiat" component={ifLoggedIn(CreateWalletSelectFiatScene)} />
      <Stack.Screen
        name="settingsOverview"
        component={ifLoggedIn(SettingsScene)}
        options={{
          title: s.strings.title_settings
        }}
        listeners={{
          focus: () => dispatch(showReEnableOtpModal())
        }}
      />
      <Stack.Screen
        name="transactionDetails"
        component={ifLoggedIn(TransactionDetailsScene)}
        options={{
          headerTitle: () => <TransactionDetailsTitle />
        }}
        listeners={{
          focus: () => {
            requestPermission('contacts').catch(showError)
          }
        }}
      />

      <Stack.Screen
        name="createWalletImport"
        component={ifLoggedIn(CreateWalletImportScene)}
        options={{
          headerRight: () => null
        }}
      />

      <Stack.Screen
        name="createWalletCompletion"
        component={ifLoggedIn(CreateWalletCompletionScene)}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />

      <Stack.Screen
        name="createWalletAccountSetup"
        component={ifLoggedIn(CreateWalletAccountSetupScene)}
        options={{
          title: s.strings.create_wallet_create_account,
          headerRight: () => <HeaderTextButton type="help" placement="right" />
        }}
      />

      <Stack.Screen
        name="createWalletAccountSelect"
        component={ifLoggedIn(CreateWalletAccountSelectScene)}
        options={{
          title: s.strings.create_wallet_account_activate,
          headerRight: () => <HeaderTextButton type="help" placement="right" />
        }}
      />

      <Stack.Screen
        name="transactionList"
        component={ifLoggedIn(TransactionList)}
        listeners={{
          focus: () => {
            requestPermission('contacts').catch(showError)
          }
        }}
      />

      <Stack.Screen name="stakeModify" component={ifLoggedIn(StakeModifyScene)} />
      <Stack.Screen name="stakeOptions" component={ifLoggedIn(StakeOptionsScene)} />
      <Stack.Screen name="stakeOverview" component={ifLoggedIn(StakeOverviewScene)} />
      <Stack.Screen name="fioStakingOverview" component={ifLoggedIn(FioStakingOverviewScene)} />
      <Stack.Screen name="fioStakingChange" component={ifLoggedIn(FioStakingChangeScene)} />

      <Stack.Screen
        name="manageTokens"
        // @ts-expect-error
        component={ifLoggedIn(ManageTokensScene)}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="editToken"
        component={ifLoggedIn(EditTokenScene)}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="transactionsExport"
        component={ifLoggedIn(TransactionsExportScene)}
        options={{
          title: s.strings.title_export_transactions,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="pluginViewBuy"
        component={ifLoggedIn(GuiPluginViewScene)}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewSell'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" placement="right" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <Stack.Screen
        name="guiPluginEnterAmount"
        component={ifLoggedIn(FiatPluginEnterAmountScene)}
        options={{
          headerLeft: () => <PluginBackButton />,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="pluginViewSell"
        component={ifLoggedIn(GuiPluginViewScene)}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewSell'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" placement="right" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <Stack.Screen
        name="exchangeQuoteProcessing"
        component={ifLoggedIn(CryptoExchangeQuoteProcessingScreen)}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="exchangeQuote" component={ifLoggedIn(CryptoExchangeQuote)} />
      <Stack.Screen
        name="exchangeSuccess"
        component={ifLoggedIn(CryptoExchangeSuccessScene)}
        options={{
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="extraTab"
        component={ifLoggedIn(ExtraTabScene)}
        options={{
          headerLeft: () => <HeaderTextButton type="help" placement="left" />
        }}
      />

      <Stack.Screen
        name="request"
        component={ifLoggedIn(RequestScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="fioRequestConfirmation"
        component={ifLoggedIn(FioRequestConfirmationScene)}
        options={{
          title: s.strings.fio_confirm_request_header
        }}
      />

      <Stack.Screen name="send" component={ifLoggedIn(SendScene)} />
      <Stack.Screen
        name="changeMiningFee"
        component={ifLoggedIn(ChangeMiningFeeScene)}
        options={{
          headerRight: () => <HeaderTextButton type="help" placement="right" />
        }}
      />

      <Stack.Screen name="send2" component={ifLoggedIn(SendScene2)} />
      <Stack.Screen
        name="changeMiningFee2"
        component={ifLoggedIn(ChangeMiningFeeScene2)}
        options={{
          headerRight: () => <HeaderTextButton type="help" placement="right" />
        }}
      />

      <Stack.Screen
        name="changePassword"
        component={ifLoggedIn(ChangePasswordScene)}
        options={{
          title: s.strings.title_change_password,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="changePin"
        component={ifLoggedIn(ChangePinScene)}
        options={{
          title: s.strings.title_change_pin,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="otpSetup"
        component={ifLoggedIn(OtpSettingsScene)}
        options={{
          title: s.strings.title_otp,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="passwordRecovery"
        component={ifLoggedIn(ChangeRecoveryScene)}
        options={{
          title: s.strings.title_password_recovery,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="spendingLimits"
        component={ifLoggedIn(SpendingLimitsScene)}
        options={{
          title: s.strings.spending_limits,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="exchangeSettings"
        // @ts-expect-error-error
        component={ifLoggedIn(SwapSettingsScene)}
        options={{
          title: s.strings.settings_exchange_settings,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="currencySettings"
        component={ifLoggedIn(CurrencySettingsScene)}
        options={{
          headerTitle: props => <CurrencySettingsTitle />,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="promotionSettings"
        component={ifLoggedIn(PromotionSettingsScene)}
        options={{
          title: s.strings.title_promotion_settings,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="defaultFiatSetting"
        component={ifLoggedIn(DefaultFiatSettingScene)}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="notificationSettings"
        component={ifLoggedIn(NotificationScene)}
        options={{
          title: s.strings.settings_notifications,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="currencyNotificationSettings"
        component={ifLoggedIn(CurrencyNotificationScene)}
        options={{
          headerTitle: props => <CurrencySettingsTitle />,
          headerRight: () => null
        }}
      />

      <Stack.Screen
        name="pluginView"
        component={ifLoggedIn(GuiPluginViewScene)}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginView'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" placement="right" />,
          headerLeft: () => <PluginBackButton />
        }}
      />

      <Stack.Screen
        name="termsOfService"
        component={ifLoggedIn(TermsOfServiceComponent)}
        options={{
          title: s.strings.title_terms_of_service
        }}
      />

      <Stack.Screen name="fioAddressList" component={ifLoggedIn(FioAddressListScene)} />

      <Stack.Screen
        name="fioAddressRegister"
        component={ifLoggedIn(FioAddressRegisterScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />

      <Stack.Screen
        name="fioAddressRegisterSelectWallet"
        component={ifLoggedIn(FioAddressRegisterSelectWalletScene)}
        options={{
          title: s.strings.title_fio_address_confirmation,
          headerRight: () => null
        }}
      />

      <Stack.Screen
        name="fioDomainRegister"
        component={ifLoggedIn(FioDomainRegisterScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="fioDomainRegisterSelectWallet"
        component={ifLoggedIn(FioDomainRegisterSelectWalletScene)}
        options={{
          title: s.strings.title_register_fio_domain,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="fioDomainConfirm"
        component={ifLoggedIn(FioNameConfirmScene)}
        options={{
          headerRight: () => null
        }}
      />

      <Stack.Screen
        name="fioNameConfirm"
        component={ifLoggedIn(FioNameConfirmScene)}
        options={{
          headerRight: () => null
        }}
      />

      <Stack.Screen
        name="fioAddressDetails"
        component={ifLoggedIn(FioAddressDetailsScene)}
        options={{
          headerTitle: () => <ParamHeaderTitle<'fioAddressDetails'> fromParams={params => params.fioAddressName} />
        }}
      />
      <Stack.Screen
        name="fioConnectToWalletsConfirm"
        component={ifLoggedIn(FioConnectWalletConfirmScene)}
        options={{
          title: s.strings.title_fio_connect_to_wallet
        }}
      />

      <Stack.Screen
        name="fioAddressSettings"
        component={FioAddressSettingsScene}
        options={{
          title: s.strings.title_fio_address_settings
        }}
      />

      <Stack.Screen
        name="fioAddressRegisterSuccess"
        component={ifLoggedIn(FioAddressRegisteredScene)}
        options={{
          headerTitle: () => <ParamHeaderTitle<'fioAddressRegisterSuccess'> fromParams={params => params.fioName} />,
          headerLeft: () => null
        }}
      />

      <Stack.Screen
        name="fioDomainSettings"
        component={FioDomainSettingsScene}
        options={{
          title: s.strings.title_fio_domain_settings
        }}
      />

      <Stack.Screen name="fioRequestList" component={ifLoggedIn(FioRequestListScene)} />
      <Stack.Screen
        name="fioRequestApproved"
        // @ts-expect-error
        component={ifLoggedIn(TransactionDetailsScene)}
        listeners={{
          focus: () => {
            requestPermission('contacts').catch(showError)
          }
        }}
        options={{
          headerTitle: () => <TransactionDetailsTitle />
        }}
      />

      <Stack.Screen
        name="fioSentRequestDetails"
        component={ifLoggedIn(FioSentRequestDetailsScene)}
        options={{
          headerRight: () => null
        }}
      />

      <Stack.Screen name="wcConnections" component={ifLoggedIn(WcConnectionsScene)} />
      <Stack.Screen name="wcDisconnect" component={ifLoggedIn(WcDisconnectScene)} />
      <Stack.Screen name="wcConnect" component={ifLoggedIn(WcConnectScene)} />

      <Stack.Screen
        name="loanDashboard"
        component={ifLoggedIn(LoanDashboardScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanCreate"
        component={ifLoggedIn(LoanCreateScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanCreateConfirmation"
        component={ifLoggedIn(LoanCreateConfirmationScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanDetails"
        // @ts-expect-error
        component={ifLoggedIn(LoanDetailsScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanManage"
        component={ifLoggedIn(LoanManageScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen
        name="loanClose"
        component={ifLoggedIn(LoanCloseScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
      <Stack.Screen name="loanStatus" component={ifLoggedIn(LoanStatusScene)} />
      <Stack.Screen
        name="coinRankingDetails"
        component={ifLoggedIn(CoinRankingDetailsScene)}
        options={{
          headerTitle: () => <EdgeLogoHeader />
        }}
      />
    </Stack.Navigator>
  )
}

const EdgeTabs = () => {
  const dispatch = useDispatch()

  return (
    <Tab.Navigator
      initialRouteName="walletList"
      tabBar={props => <MenuTabs {...props} />}
      screenOptions={{
        title: '',
        headerTitle: ({ children }: HeaderTitleProps) => <HeaderTitle title={children} />,
        headerLeft: () => <HeaderTextButton type="help" placement="left" />,
        headerRight: () => <SideMenuButton />,
        headerShown: true,
        headerTransparent: true,
        unmountOnBlur: true
      }}
    >
      <Tab.Screen
        name="walletList"
        component={ifLoggedIn(WalletListScene)}
        options={{
          headerTitle: EdgeLogoHeader
        }}
      />
      <Tab.Screen
        name="pluginListBuy"
        // @ts-expect-error
        component={ifLoggedIn(GuiPluginListScene)}
        route={{ params: { direction: 'buy' } }}
      />
      <Tab.Screen
        name="pluginListSell"
        // @ts-expect-error
        component={ifLoggedIn(GuiPluginListScene)}
        route={{ params: { direction: 'sell' } }}
      />
      <Tab.Screen
        name="exchange"
        component={ifLoggedIn(CryptoExchangeScene)}
        listeners={{
          focus: () => dispatch(checkEnabledExchanges())
        }}
      />
      <Tab.Screen
        name="coinRanking"
        component={ifLoggedIn(CoinRankingScene)}
        listeners={{
          focus: () => dispatch(checkEnabledExchanges())
        }}
      />
      <Tab.Screen name="extraTab" component={ifLoggedIn(ExtraTabScene)} />
    </Tab.Navigator>
  )
}
