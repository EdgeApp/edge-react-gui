// @flow

import * as React from 'react'
import { YellowBox } from 'react-native'
import { Drawer, Router, Scene, Stack, Tabs } from 'react-native-router-flux'

import ENV from '../../env.json'
import { checkEnabledExchanges } from '../actions/CryptoExchangeActions.js'
import { registerDevice } from '../actions/DeviceIdActions.js'
import { logoutRequest } from '../actions/LoginActions.js'
import { checkAndShowGetCryptoModal } from '../actions/ScanActions.js'
import { showReEnableOtpModal } from '../actions/SettingsActions.js'
import { CreateWalletChoiceScene } from '../components/scenes/CreateWalletChoiceScene.js'
import { CreateWalletImportScene } from '../components/scenes/CreateWalletImportScene.js'
import { CreateWalletReviewScene } from '../components/scenes/CreateWalletReviewScene.js'
import { CreateWalletSelectCryptoScene } from '../components/scenes/CreateWalletSelectCryptoScene.js'
import { CreateWalletSelectFiatScene } from '../components/scenes/CreateWalletSelectFiatScene.js'
import { CryptoExchangeQuote } from '../components/scenes/CryptoExchangeQuoteScene.js'
import { CryptoExchangeScene } from '../components/scenes/CryptoExchangeScene.js'
import { CryptoExchangeSuccessScene } from '../components/scenes/CryptoExchangeSuccessScene.js'
import { CurrencySettingsScene } from '../components/scenes/CurrencySettingsScene.js'
import { DefaultFiatSettingScene } from '../components/scenes/DefaultFiatSettingScene.js'
import { FioAddressDetailsScene } from '../components/scenes/FioAddressDetailsScene'
import { FioAddressListScene } from '../components/scenes/FioAddressListScene'
import { FioAddressRegisteredScene } from '../components/scenes/FioAddressRegisteredScene'
import { FioAddressRegisterScene } from '../components/scenes/FioAddressRegisterScene'
import { FioAddressRegisterSelectWalletScene } from '../components/scenes/FioAddressRegisterSelectWalletScene'
import { FioAddressSettingsScene } from '../components/scenes/FioAddressSettingsScene'
import { FioConnectWalletConfirmScene } from '../components/scenes/FioConnectWalletConfirmScene'
import { FioDomainSettingsScene } from '../components/scenes/FioDomainSettingsScene'
import { FioRequestConfirmationScene } from '../components/scenes/FioRequestConfirmationScene.js'
import { FioRequestListScene } from '../components/scenes/FioRequestListScene'
import { FioSentRequestDetailsScene } from '../components/scenes/FioSentRequestDetailsScene'
import { PromotionSettingsScene } from '../components/scenes/PromotionSettingsScene.js'
import { SwapSettingsScene } from '../components/scenes/SwapSettingsScene.js'
import { TransactionsExportScene } from '../components/scenes/TransactionsExportScene.js'
import { WalletListScene } from '../components/scenes/WalletListScene.js'
import { requestPermission } from '../components/services/PermissionsManager.js'
import { ControlPanel } from '../components/themed/ControlPanel'
import s from '../locales/strings.js'
import { FiatPluginEnterAmountScene } from '../plugins/gui/scenes/EnterAmountScene'
import { type Permission } from '../reducers/PermissionsReducer.js'
import { connect } from '../types/reactRedux.js'
import { type NavigationProp, Actions, withNavigation } from '../types/routerTypes.js'
import { scale } from '../util/scaling.js'
import { logEvent } from '../util/tracking.js'
import { AirshipToast } from './common/AirshipToast.js'
import { ifLoggedIn } from './hoc/IfLoggedIn.js'
import { BackButton } from './navigation/BackButton.js'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle.js'
import { EdgeLogoHeader } from './navigation/EdgeLogoHeader.js'
import { handlePluginBack, renderPluginBackButton } from './navigation/GuiPluginBackButton.js'
import { HeaderTextButton } from './navigation/HeaderTextButton.js'
import { HeaderTitle } from './navigation/HeaderTitle.js'
import { SideMenuButton } from './navigation/SideMenuButton.js'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle.js'
import { AddCollateralScene } from './scenes/AddCollateralScene.js'
import { ChangeMiningFeeScene } from './scenes/ChangeMiningFeeScene.js'
import { ChangePasswordScene } from './scenes/ChangePasswordScene.js'
import { ChangePinScene } from './scenes/ChangePinScene.js'
import { CreateWalletAccountSelectScene } from './scenes/CreateWalletAccountSelectScene.js'
import { CreateWalletAccountSetupScene } from './scenes/CreateWalletAccountSetupScene.js'
import { CreateWalletName } from './scenes/CreateWalletNameScene.js'
import { CryptoExchangeQuoteProcessingScreen } from './scenes/CryptoExchangeQuoteProcessingScene.js'
import { CurrencyNotificationScene } from './scenes/CurrencyNotificationScene'
import { EdgeLoginScene } from './scenes/EdgeLoginScene.js'
import { EditTokenScene } from './scenes/EditTokenScene.js'
import { FioDomainRegisterScene } from './scenes/FioDomainRegisterScene'
import { FioDomainRegisterSelectWalletScene } from './scenes/FioDomainRegisterSelectWalletScene'
import { FioNameConfirmScene } from './scenes/FioNameConfirmScene'
import { FioStakingChangeScene } from './scenes/FioStakingChangeScene'
import { FioStakingOverviewScene } from './scenes/FioStakingOverviewScene.js'
import { GuiPluginListScene } from './scenes/GuiPluginListScene.js'
import { GuiPluginViewScene } from './scenes/GuiPluginViewScene.js'
import { LoanDashboardScene } from './scenes/Loans/LoanDashboardScene'
import { LoanDetailsConfirmationScene } from './scenes/Loans/LoanDetailsConfirmationScene'
import { LoanDetailsScene } from './scenes/Loans/LoanDetailsScene'
import { LoginScene } from './scenes/LoginScene.js'
import { MakeLoanPaymentScene } from './scenes/MakeLoanPaymentScene.js'
import { ManageTokensScene } from './scenes/ManageTokensScene.js'
import { NotificationScene } from './scenes/NotificationScene'
import { OtpRepairScene } from './scenes/OtpRepairScene.js'
import { OtpSettingsScene } from './scenes/OtpSettingsScene.js'
import { ChangeRecoveryScene } from './scenes/PasswordRecoveryScene.js'
import { Request } from './scenes/RequestScene.js'
import { SecurityAlertsScene } from './scenes/SecurityAlertsScene.js'
import { SendScene } from './scenes/SendScene.js'
import { SettingsScene } from './scenes/SettingsScene.js'
import { SpendingLimitsScene } from './scenes/SpendingLimitsScene.js'
import { StakeModifyScene } from './scenes/Staking/StakeModifyScene'
import { StakeOptionsScene } from './scenes/Staking/StakeOptionsScene'
import { StakeOverviewScene } from './scenes/Staking/StakeOverviewScene'
import { TermsOfServiceComponent } from './scenes/TermsOfServiceScene.js'
import { TransactionDetailsScene } from './scenes/TransactionDetailsScene.js'
import { TransactionList } from './scenes/TransactionListScene.js'
import { WcConnectionsScene } from './scenes/WcConnectionsScene'
import { WcConnectScene } from './scenes/WcConnectScene'
import { WcDisconnectScene } from './scenes/WcDisconnectScene'
import { WithdrawCollateralScene } from './scenes/WithdrawCollateralScene'
import { Airship } from './services/AirshipInstance.js'
import { MenuTab } from './themed/MenuTab.js'

const RouterWithRedux = connect<
  {},
  {},
  {
    children?: React.Node,
    backAndroidHandler?: () => boolean
  }
>(
  state => ({}),
  dispatch => ({})
)(Router)

type DispatchProps = {
  registerDevice: () => void,

  // Navigation actions:
  logout: (username?: string) => void,

  // Things to do when we enter certain scenes:
  checkAndShowGetCryptoModal: (selectedWalletId?: string, selectedCurrencyCode?: string) => void,
  checkEnabledExchanges: () => void,
  dispatchDisableScan: () => void,
  // eslint-disable-next-line react/no-unused-prop-types
  dispatchEnableScan: () => void,
  requestPermission: (permission: Permission) => void,
  showReEnableOtpModal: () => void
}

type OwnProps = {
  navigation: NavigationProp<'root'>
}

type Props = DispatchProps & OwnProps

export class MainComponent extends React.Component<Props> {
  backPressedOnce: boolean

  constructor(props: Props) {
    super(props)

    if (ENV.HIDE_IS_MOUNTED) {
      YellowBox.ignoreWarnings([
        'Warning: isMounted(...) is deprecated',
        'Module RCTImageLoader',
        'The scalesPageToFit property is not supported when useWebKit = true'
      ])
    }
  }

  componentDidMount() {
    logEvent('AppStart')
    this.props.registerDevice()
  }

  render() {
    return (
      <>
        <RouterWithRedux backAndroidHandler={this.handleBack}>
          <Stack key="root" hideNavBar panHandlers={null}>
            <Scene key="login" component={withNavigation(LoginScene)} initial />
            <Scene
              key="edgeLogin"
              component={withNavigation(ifLoggedIn(EdgeLoginScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_edge_login} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<HeaderTextButton navigation={this.props.navigation} type="help" placement="right" />}
            />
            {this.renderTransactionDetailsView()}
            {this.renderTabView()}
          </Stack>
        </RouterWithRedux>
      </>
    )
  }

  renderTransactionDetailsView = () => {
    return (
      <Scene
        key="transactionDetails"
        component={withNavigation(ifLoggedIn(TransactionDetailsScene))}
        navTransparent
        onEnter={() => this.props.requestPermission('contacts')}
        clone
        renderTitle={props => <TransactionDetailsTitle edgeTransaction={props.route.params.edgeTransaction} />}
        renderLeftButton={<BackButton onPress={this.handleBack} />}
        renderRightButton={<SideMenuButton />}
      />
    )
  }

  renderTabView = () => {
    const { navigation } = this.props
    return (
      <Drawer
        hideTabBar
        drawerBackgroundColor="none"
        key="edge"
        hideNavBar
        contentComponent={withNavigation(ifLoggedIn(ControlPanel))}
        hideDrawerButton
        drawerPosition="right"
        drawerWidth={scale(270)}
      >
        {/* Wrapper Scene needed to fix a bug where the tabs would reload as a modal ontop of itself */}
        <Scene key="AllMyTabs" hideNavBar>
          <Tabs key="edge" swipeEnabled={false} tabBarPosition="bottom" tabBarComponent={MenuTab}>
            <Stack key="walletList">
              <Scene
                key="walletListScene"
                component={withNavigation(ifLoggedIn(WalletListScene))}
                navTransparent
                renderTitle={<EdgeLogoHeader />}
                renderLeftButton={<HeaderTextButton navigation={navigation} type="help" placement="left" />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="createWalletChoice"
                component={withNavigation(ifLoggedIn(CreateWalletChoiceScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletImport"
                component={withNavigation(ifLoggedIn(CreateWalletImportScene))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.create_wallet_import_title} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletSelectCrypto"
                component={withNavigation(ifLoggedIn(CreateWalletSelectCryptoScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletName"
                component={withNavigation(ifLoggedIn(CreateWalletName))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletSelectFiat"
                component={withNavigation(ifLoggedIn(CreateWalletSelectFiatScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletReview"
                component={withNavigation(ifLoggedIn(CreateWalletReviewScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletAccountSetup"
                component={withNavigation(ifLoggedIn(CreateWalletAccountSetupScene))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.create_wallet_create_account} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<HeaderTextButton navigation={this.props.navigation} type="help" placement="right" />}
              />

              <Scene
                key="createWalletAccountSelect"
                component={withNavigation(ifLoggedIn(CreateWalletAccountSelectScene))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.create_wallet_account_activate} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<HeaderTextButton navigation={this.props.navigation} type="help" placement="right" />}
              />

              <Scene
                key="transactionList"
                component={withNavigation(ifLoggedIn(TransactionList))}
                onEnter={() => {
                  this.props.requestPermission('contacts')
                }}
                navTransparent
                renderTitle={<HeaderTitle title=" " />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="stakeModify"
                navTransparent
                component={withNavigation(ifLoggedIn(StakeModifyScene))}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="stakeOptions"
                navTransparent
                component={withNavigation(ifLoggedIn(StakeOptionsScene))}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="stakeOverview"
                navTransparent
                component={withNavigation(ifLoggedIn(StakeOverviewScene))}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="fioStakingOverview"
                navTransparent
                component={ifLoggedIn(FioStakingOverviewScene)}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="fioStakingChange"
                navTransparent
                component={ifLoggedIn(FioStakingChangeScene)}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="manageTokens"
                component={withNavigation(ifLoggedIn(ManageTokensScene))}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
                navTransparent
                renderTitle=""
                animation="fade"
                duration={600}
              />
              <Scene
                key="editToken"
                component={withNavigation(ifLoggedIn(EditTokenScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />
              <Scene
                key="transactionsExport"
                component={withNavigation(ifLoggedIn(TransactionsExportScene))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.title_export_transactions} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />
            </Stack>
            <Stack key="pluginListBuy">
              <Scene
                key="pluginListBuy"
                component={withNavigation(ifLoggedIn(GuiPluginListScene))}
                navTransparent
                renderLeftButton={<HeaderTextButton navigation={this.props.navigation} type="help" placement="left" />}
                renderRightButton={<SideMenuButton />}
                onLeft={this.props.navigation.pop}
                route={{ params: { direction: 'buy' } }}
              />
              <Scene
                key="pluginViewBuy"
                component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
                navTransparent
                renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
                renderLeftButton={renderPluginBackButton(navigation)}
                renderRightButton={<HeaderTextButton navigation={this.props.navigation} type="exit" placement="right" />}
                hideTabBar
              />
              <Scene
                key="guiPluginEnterAmount"
                component={withNavigation(ifLoggedIn(FiatPluginEnterAmountScene))}
                navTransparent
                renderLeftButton={renderPluginBackButton()}
                hideTabBar
              />
            </Stack>
            <Stack key="pluginListSell">
              <Scene
                key="pluginListSell"
                component={withNavigation(ifLoggedIn(GuiPluginListScene))}
                navTransparent
                renderLeftButton={<HeaderTextButton navigation={this.props.navigation} type="help" placement="left" />}
                renderRightButton={<SideMenuButton />}
                onLeft={this.props.navigation.pop}
                route={{ params: { direction: 'sell' } }}
              />
              <Scene
                key="pluginViewSell"
                component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
                navTransparent
                renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
                renderLeftButton={renderPluginBackButton(navigation)}
                renderRightButton={<HeaderTextButton navigation={this.props.navigation} type="exit" placement="right" />}
                hideTabBar
              />
            </Stack>
            <Stack key="exchange">
              <Scene
                key="exchangeScene"
                component={withNavigation(ifLoggedIn(CryptoExchangeScene))}
                navTransparent
                renderLeftButton={<HeaderTextButton navigation={this.props.navigation} type="help" placement="left" />}
                renderRightButton={<SideMenuButton />}
                onEnter={() => this.props.checkEnabledExchanges()}
              />
              <Scene
                key="exchangeQuoteProcessing"
                component={withNavigation(ifLoggedIn(CryptoExchangeQuoteProcessingScreen))}
                navTransparent
                hideTabBar
                renderLeftButton={this.renderEmptyButton()}
                renderRightButton={this.renderEmptyButton()}
              />
              <Scene
                key="exchangeQuote"
                component={withNavigation(ifLoggedIn(CryptoExchangeQuote))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
              />
              <Scene
                key="exchangeSuccess"
                component={withNavigation(ifLoggedIn(CryptoExchangeSuccessScene))}
                navTransparent
                renderLeftButton={this.renderEmptyButton()}
              />
            </Stack>
          </Tabs>

          <Stack key="request" hideTabBar>
            <Scene
              key="request"
              component={withNavigation(ifLoggedIn(Request))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              renderTitle={<EdgeLogoHeader />}
            />
            <Scene
              key="fioRequestConfirmation"
              component={withNavigation(ifLoggedIn(FioRequestConfirmationScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.fio_confirm_request_header} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key="send" hideTabBar>
            <Scene
              key="send"
              component={withNavigation(ifLoggedIn(SendScene))}
              navTransparent
              onEnter={props => {
                this.props.checkAndShowGetCryptoModal(props.route.params.selectedWalletId, props.route.params.selectedCurrencyCode)
              }}
              onExit={this.props.dispatchDisableScan}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
            />
            <Scene
              key="changeMiningFee"
              component={withNavigation(ifLoggedIn(ChangeMiningFeeScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<HeaderTextButton navigation={this.props.navigation} type="help" placement="right" />}
            />
          </Stack>

          <Stack key="passwordRecovery" hideTabBar>
            <Scene
              key="passwordRecovery"
              component={withNavigation(ifLoggedIn(ChangeRecoveryScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_password_recovery} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
            />
          </Stack>

          <Stack key="otpRepair" hideNavBar>
            <Scene key="otpRepair" component={withNavigation(ifLoggedIn(OtpRepairScene))} navTransparent />
          </Stack>

          <Stack key="securityAlerts" hideNavBar>
            <Scene key="securityAlerts" component={withNavigation(ifLoggedIn(SecurityAlertsScene))} navTransparent />
          </Stack>

          <Stack key="manageTokens" hideTabBar>
            <Scene
              key="manageTokens_notused"
              component={withNavigation(ifLoggedIn(ManageTokensScene))}
              navTransparent
              renderTitle=""
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack key="settingsOverviewTab" hideDrawerButton>
            <Scene
              key="settingsOverview"
              component={withNavigation(ifLoggedIn(SettingsScene))}
              navTransparent
              onEnter={() => this.props.showReEnableOtpModal()}
              renderTitle={<HeaderTitle title={s.strings.title_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
            />
            <Scene
              key="changePassword"
              component={withNavigation(ifLoggedIn(ChangePasswordScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_change_password} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="changePin"
              component={withNavigation(ifLoggedIn(ChangePinScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_change_pin} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="otpSetup"
              component={withNavigation(ifLoggedIn(OtpSettingsScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_otp} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="passwordRecovery"
              component={withNavigation(ifLoggedIn(ChangeRecoveryScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_password_recovery} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="spendingLimits"
              component={withNavigation(ifLoggedIn(SpendingLimitsScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.spending_limits} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="exchangeSettings"
              component={withNavigation(ifLoggedIn(SwapSettingsScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.settings_exchange_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="currencySettings"
              component={withNavigation(ifLoggedIn(CurrencySettingsScene))}
              navTransparent
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.route.params.currencyInfo} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="promotionSettings"
              component={withNavigation(ifLoggedIn(PromotionSettingsScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_promotion_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="defaultFiatSetting"
              component={withNavigation(ifLoggedIn(DefaultFiatSettingScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="notificationSettings"
              component={withNavigation(ifLoggedIn(NotificationScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.settings_notifications} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={this.props.navigation.pop}
            />
            <Scene
              key="currencyNotificationSettings"
              component={withNavigation(ifLoggedIn(CurrencyNotificationScene))}
              navTransparent
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.route.params.currencyInfo} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="pluginView" hideDrawerButton>
            <Scene
              key="pluginView"
              component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
              renderLeftButton={renderPluginBackButton(navigation)}
              renderRightButton={<HeaderTextButton navigation={this.props.navigation} type="exit" placement="right" />}
            />
          </Stack>

          <Stack key="addCollateralScene" hideDrawerButton>
            <Scene
              key="addCollateralScene"
              component={withNavigation(ifLoggedIn(AddCollateralScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={renderPluginBackButton()}
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key="withdrawCollateralScene" hideDrawerButton>
            <Scene
              key="withdrawCollateralScene"
              component={withNavigation(ifLoggedIn(WithdrawCollateralScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={renderPluginBackButton()}
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key="makeLoanPaymentScene" hideDrawerButton>
            <Scene
              key="makeLoanPaymentScene"
              component={withNavigation(ifLoggedIn(MakeLoanPaymentScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={renderPluginBackButton()}
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key="termsOfService">
            <Scene
              key="termsOfService"
              component={withNavigation(ifLoggedIn(TermsOfServiceComponent))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_terms_of_service} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioAddressList">
            <Scene
              key="fioAddressList"
              component={withNavigation(ifLoggedIn(FioAddressListScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioAddressRegister">
            <Scene
              key="fioAddressRegister"
              component={withNavigation(ifLoggedIn(FioAddressRegisterScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioAddressRegisterSelectWallet">
            <Scene
              key="fioAddressRegisterSelectWallet"
              component={withNavigation(ifLoggedIn(FioAddressRegisterSelectWalletScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_fio_address_confirmation} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioDomainRegister">
            <Scene
              key="fioDomainRegister"
              component={withNavigation(ifLoggedIn(FioDomainRegisterScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
            <Scene
              key="fioDomainRegisterSelectWallet"
              component={withNavigation(ifLoggedIn(FioDomainRegisterSelectWalletScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_register_fio_domain} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={this.props.navigation.pop}
            />
            <Scene
              key="fioDomainConfirm"
              component={withNavigation(ifLoggedIn(FioNameConfirmScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioNameConfirm">
            <Scene
              key="fioNameConfirm"
              component={withNavigation(ifLoggedIn(FioNameConfirmScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioAddressDetails">
            <Scene
              key="fioAddressDetails"
              component={withNavigation(ifLoggedIn(FioAddressDetailsScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.fioAddressName} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
            />
            <Scene
              key="fioConnectToWalletsConfirm"
              component={withNavigation(ifLoggedIn(FioConnectWalletConfirmScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_fio_connect_to_wallet} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioAddressSettings">
            <Scene
              key="fioAddressSettings"
              component={withNavigation(FioAddressSettingsScene)}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_fio_address_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioAddressRegisterSuccess">
            <Scene
              key="fioAddressRegisterSuccess"
              component={withNavigation(ifLoggedIn(FioAddressRegisteredScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.fioName} />}
              renderRightButton={<SideMenuButton />}
              renderLeftButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack key="fioDomainSettings">
            <Scene
              key="fioDomainSettings"
              component={withNavigation(FioDomainSettingsScene)}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_fio_domain_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="fioRequestList">
            <Scene
              key="fioRequestList"
              component={withNavigation(ifLoggedIn(FioRequestListScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
            <Scene
              key="fioRequestApproved"
              component={withNavigation(ifLoggedIn(TransactionDetailsScene))}
              navTransparent
              onEnter={() => this.props.requestPermission('contacts')}
              clone
              renderTitle={props => <TransactionDetailsTitle edgeTransaction={props.route.params.edgeTransaction} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key="fioSentRequestDetails">
            <Scene
              key="fioSentRequestDetails"
              component={withNavigation(ifLoggedIn(FioSentRequestDetailsScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="wcConnections">
            <Scene
              key="wcConnections"
              component={withNavigation(ifLoggedIn(WcConnectionsScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
            <Scene
              key="wcDisconnect"
              component={withNavigation(ifLoggedIn(WcDisconnectScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
            <Scene
              key="wcConnect"
              component={withNavigation(ifLoggedIn(WcConnectScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={this.props.navigation.pop}
            />
          </Stack>

          <Stack key="loan">
            <Scene
              key="loanDashboard"
              component={withNavigation(ifLoggedIn(LoanDashboardScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="loan">
            <Scene
              key="loanDashboard"
              component={withNavigation(ifLoggedIn(LoanDashboardScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="loanDetails"
              component={withNavigation(ifLoggedIn(LoanDetailsScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="loanDetailsConfirmation"
              component={withNavigation(ifLoggedIn(LoanDetailsConfirmationScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>
        </Scene>
      </Drawer>
    )
  }

  renderEmptyButton = () => {
    return <BackButton isEmpty onPress={this.handleEmpty} />
  }

  isCurrentScene = (sceneKey: string) => {
    // For now we'd have to use Flux because our custom navigation hook
    // does not implment the routeName state. We can remove this once we
    // have migrated to the official react-navigation library by
    // replacing it with the following:
    // https://stackoverflow.com/questions/53040094/how-to-get-current-route-name-in-react-navigation
    return Actions.currentScene === sceneKey
  }

  handleEmpty = () => null

  handleBack = () => {
    if (this.isCurrentScene('login')) {
      return false
    }
    if (this.isCurrentScene('walletListScene')) {
      if (this.backPressedOnce) {
        this.props.logout()
      } else {
        this.backPressedOnce = true
        Airship.show(bridge => <AirshipToast bridge={bridge} message={s.strings.back_button_tap_again_to_exit} />).then(() => {
          this.backPressedOnce = false
        })
      }
      return true
    }
    if (this.isCurrentScene('exchangeQuote')) {
      this.props.navigation.navigate('exchangeScene')
      return true
    }
    if (this.isCurrentScene('pluginViewBuy') || this.isCurrentScene('pluginViewSell') || this.isCurrentScene('pluginView')) {
      handlePluginBack(this.props.navigation)
      return true
    }
    if (this.isCurrentScene('fioAddressRegister')) {
      if (Actions.currentParams.noAddresses) {
        this.props.navigation.navigate('walletListScene')
        return true
      }
    }
    if (this.isCurrentScene('fioAddressRegisterSelectWallet')) {
      if (Actions.currentParams.isFallback) {
        this.props.navigation.navigate('fioAddressRegister')
        return true
      }
    }
    this.props.navigation.pop()
    return true
  }
}

export const Main = connect<{}, DispatchProps, OwnProps>(
  state => ({}),
  dispatch => ({
    registerDevice() {
      dispatch(registerDevice())
    },

    // Navigation actions:
    logout(username?: string): void {
      dispatch(logoutRequest(username))
    },

    // Things to do when we enter certain scenes:
    checkAndShowGetCryptoModal(selectedWalletId?: string, selectedCurrencyCode?: string) {
      dispatch(checkAndShowGetCryptoModal(selectedWalletId, selectedCurrencyCode))
    },
    checkEnabledExchanges() {
      dispatch(checkEnabledExchanges())
    },
    dispatchDisableScan() {
      dispatch({ type: 'DISABLE_SCAN' })
    },
    dispatchEnableScan() {
      dispatch({ type: 'ENABLE_SCAN' })
    },
    requestPermission(permission: Permission) {
      requestPermission(permission)
    },
    showReEnableOtpModal() {
      dispatch(showReEnableOtpModal())
    }
  })
)(MainComponent)
