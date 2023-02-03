import * as React from 'react'
import { Drawer, Router, Scene, Stack, Tabs } from 'react-native-router-flux'

import { checkEnabledExchanges } from '../actions/CryptoExchangeActions'
import { logoutRequest } from '../actions/LoginActions'
import { checkAndShowGetCryptoModal } from '../actions/ScanActions'
import { showReEnableOtpModal } from '../actions/SettingsActions'
import { CreateWalletImportScene } from '../components/scenes/CreateWalletImportScene'
import { CreateWalletSelectCryptoScene } from '../components/scenes/CreateWalletSelectCryptoScene'
import { CryptoExchangeQuote } from '../components/scenes/CryptoExchangeQuoteScene'
import { CryptoExchangeScene } from '../components/scenes/CryptoExchangeScene'
import { CryptoExchangeSuccessScene } from '../components/scenes/CryptoExchangeSuccessScene'
import { CurrencySettingsScene } from '../components/scenes/CurrencySettingsScene'
import { DefaultFiatSettingScene } from '../components/scenes/DefaultFiatSettingScene'
import { ExtraTabScene } from '../components/scenes/ExtraTabScene'
import { FioAddressDetailsScene } from '../components/scenes/FioAddressDetailsScene'
import { FioAddressListScene } from '../components/scenes/FioAddressListScene'
import { FioAddressRegisteredScene } from '../components/scenes/FioAddressRegisteredScene'
import { FioAddressRegisterScene } from '../components/scenes/FioAddressRegisterScene'
import { FioAddressRegisterSelectWalletScene } from '../components/scenes/FioAddressRegisterSelectWalletScene'
import { FioAddressSettingsScene } from '../components/scenes/FioAddressSettingsScene'
import { FioConnectWalletConfirmScene } from '../components/scenes/FioConnectWalletConfirmScene'
import { FioDomainSettingsScene } from '../components/scenes/FioDomainSettingsScene'
import { FioRequestConfirmationScene } from '../components/scenes/FioRequestConfirmationScene'
import { FioRequestListScene } from '../components/scenes/FioRequestListScene'
import { FioSentRequestDetailsScene } from '../components/scenes/FioSentRequestDetailsScene'
import { PromotionSettingsScene } from '../components/scenes/PromotionSettingsScene'
import { SwapSettingsScene } from '../components/scenes/SwapSettingsScene'
import { TransactionsExportScene } from '../components/scenes/TransactionsExportScene'
import { WalletListScene } from '../components/scenes/WalletListScene'
import { requestPermission } from '../components/services/PermissionsManager'
import { ControlPanel } from '../components/themed/ControlPanel'
import s from '../locales/strings'
import { FiatPluginEnterAmountScene } from '../plugins/gui/scenes/EnterAmountScene'
import { Permission } from '../reducers/PermissionsReducer'
import { connect } from '../types/reactRedux'
import { Actions, NavigationBase, withNavigation } from '../types/routerTypes'
import { scale } from '../util/scaling'
import { logEvent } from '../util/tracking'
import { AirshipToast } from './common/AirshipToast'
import { ifLoggedIn } from './hoc/IfLoggedIn'
import { withServices } from './hoc/withServices'
import { BackButton } from './navigation/BackButton'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle'
import { EdgeLogoHeader } from './navigation/EdgeLogoHeader'
import { PluginBackButton } from './navigation/GuiPluginBackButton'
import { HeaderTextButton } from './navigation/HeaderTextButton'
import { HeaderTitle } from './navigation/HeaderTitle'
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
import { CreateWalletSelectFiatScene } from './scenes/CreateWalletSelectFiatScene'
import { CryptoExchangeQuoteProcessingScreen } from './scenes/CryptoExchangeQuoteProcessingScene'
import { CurrencyNotificationScene } from './scenes/CurrencyNotificationScene'
import { EdgeLoginScene } from './scenes/EdgeLoginScene'
import { EditTokenScene } from './scenes/EditTokenScene'
import { FioDomainRegisterScene } from './scenes/FioDomainRegisterScene'
import { FioDomainRegisterSelectWalletScene } from './scenes/FioDomainRegisterSelectWalletScene'
import { FioNameConfirmScene } from './scenes/FioNameConfirmScene'
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
import { OtpRepairScene } from './scenes/OtpRepairScene'
import { OtpSettingsScene } from './scenes/OtpSettingsScene'
import { ChangeRecoveryScene } from './scenes/PasswordRecoveryScene'
import { RequestScene } from './scenes/RequestScene'
import { SecurityAlertsScene } from './scenes/SecurityAlertsScene'
import { SendScene } from './scenes/SendScene'
import { SendScene2 } from './scenes/SendScene2'
import { SettingsScene } from './scenes/SettingsScene'
import { SpendingLimitsScene } from './scenes/SpendingLimitsScene'
import { StakeModifyScene } from './scenes/Staking/StakeModifyScene'
import { StakeOptionsScene } from './scenes/Staking/StakeOptionsScene'
import { StakeOverviewScene } from './scenes/Staking/StakeOverviewScene'
import { TermsOfServiceComponent } from './scenes/TermsOfServiceScene'
import { TransactionDetailsScene } from './scenes/TransactionDetailsScene'
import { TransactionList } from './scenes/TransactionListScene'
import { WcConnectionsScene } from './scenes/WcConnectionsScene'
import { WcConnectScene } from './scenes/WcConnectScene'
import { WcDisconnectScene } from './scenes/WcDisconnectScene'
import { Airship } from './services/AirshipInstance'
import { MenuTabs } from './themed/MenuTabs'

const RouterWithRedux = connect<
  {},
  {},
  {
    children?: React.ReactNode
    backAndroidHandler?: () => boolean
  }
>(
  state => ({}),
  dispatch => ({})
  // @ts-expect-error
)(Router)

interface DispatchProps {
  // Navigation actions:
  logout: (username?: string) => void

  // Things to do when we enter certain scenes:
  checkAndShowGetCryptoModal: (navigation: NavigationBase, selectedWalletId?: string, selectedCurrencyCode?: string) => void
  checkEnabledExchanges: () => void
  requestPermission: (permission: Permission) => void
  showReEnableOtpModal: () => void
}

type Props = DispatchProps

export class MainComponent extends React.Component<Props> {
  // @ts-expect-error
  backPressedOnce: boolean

  componentDidMount() {
    logEvent('AppStart')
  }

  render() {
    return (
      <>
        <RouterWithRedux backAndroidHandler={this.handleBack}>
          <Stack
            key="root"
            hideNavBar
            // @ts-expect-error
            panHandlers={null}
          >
            <Scene key="login" component={withNavigation(withServices(LoginScene))} initial />
            <Scene
              key="edgeLogin"
              component={withNavigation(ifLoggedIn(EdgeLoginScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_edge_login} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<HeaderTextButton type="help" placement="right" />}
            />
            <Scene key="createWalletSelectCrypto" component={withNavigation(CreateWalletSelectCryptoScene)} navTransparent />
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
        // @ts-expect-error
        renderLeftButton={<BackButton onPress={this.handleBack} />}
        // @ts-expect-error
        renderRightButton={<SideMenuButton />}
      />
    )
  }

  renderTabView = () => {
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
          <Tabs key="edgeApp" swipeEnabled={false} tabBarPosition="bottom" tabBarComponent={withNavigation(MenuTabs)}>
            <Stack key="walletList">
              <Scene
                key="walletListScene"
                component={withNavigation(ifLoggedIn(WalletListScene))}
                navTransparent
                // @ts-expect-error
                renderTitle={<EdgeLogoHeader />}
                // @ts-expect-error
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="createWalletImport"
                component={withNavigation(ifLoggedIn(CreateWalletImportScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletSelectCrypto"
                component={withNavigation(ifLoggedIn(CreateWalletSelectCryptoScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletSelectFiat"
                component={withNavigation(ifLoggedIn(CreateWalletSelectFiatScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletCompletion"
                component={withNavigation(ifLoggedIn(CreateWalletCompletionScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={this.renderEmptyButton()}
                // @ts-expect-error
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key="createWalletAccountSetup"
                component={withNavigation(ifLoggedIn(CreateWalletAccountSetupScene))}
                navTransparent
                renderTitle={() => <HeaderTitle title={s.strings.create_wallet_create_account} />}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<HeaderTextButton type="help" placement="right" />}
              />

              <Scene
                key="createWalletAccountSelect"
                component={withNavigation(ifLoggedIn(CreateWalletAccountSelectScene))}
                navTransparent
                renderTitle={() => <HeaderTitle title={s.strings.create_wallet_account_activate} />}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<HeaderTextButton type="help" placement="right" />}
              />

              <Scene
                key="transactionList"
                component={withNavigation(ifLoggedIn(TransactionList))}
                onEnter={() => {
                  this.props.requestPermission('contacts')
                }}
                navTransparent
                renderTitle={() => <HeaderTitle title=" " />}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="stakeModify"
                navTransparent
                component={withNavigation(ifLoggedIn(StakeModifyScene))}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="stakeOptions"
                navTransparent
                component={withNavigation(ifLoggedIn(StakeOptionsScene))}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="stakeOverview"
                navTransparent
                component={withNavigation(ifLoggedIn(StakeOverviewScene))}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="fioStakingOverview"
                navTransparent
                component={ifLoggedIn(FioStakingOverviewScene)}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="fioStakingChange"
                navTransparent
                component={ifLoggedIn(FioStakingChangeScene)}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key="manageTokens"
                component={withNavigation(ifLoggedIn(ManageTokensScene))}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={this.renderEmptyButton()}
                navTransparent
                // @ts-expect-error
                renderTitle=""
                animation="fade"
                duration={600}
              />
              <Scene
                key="editToken"
                component={withNavigation(ifLoggedIn(EditTokenScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={this.renderEmptyButton()}
              />
              <Scene
                key="transactionsExport"
                component={withNavigation(ifLoggedIn(TransactionsExportScene))}
                navTransparent
                renderTitle={() => <HeaderTitle title={s.strings.title_export_transactions} />}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={this.renderEmptyButton()}
              />
            </Stack>
            <Stack key="pluginListBuy">
              <Scene
                key="pluginListBuy"
                component={withNavigation(ifLoggedIn(GuiPluginListScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
                onLeft={Actions.pop}
                route={{ params: { direction: 'buy' } }}
              />
              <Scene
                key="pluginViewBuy"
                component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
                navTransparent
                renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
                renderLeftButton={PluginBackButton}
                // @ts-expect-error
                renderRightButton={<HeaderTextButton type="exit" placement="right" />}
                hideTabBar
              />
              <Scene
                key="guiPluginEnterAmount"
                component={withNavigation(ifLoggedIn(FiatPluginEnterAmountScene))}
                navTransparent
                renderLeftButton={PluginBackButton}
                hideTabBar
              />
            </Stack>
            <Stack key="pluginListSell">
              <Scene
                key="pluginListSell"
                component={withNavigation(ifLoggedIn(GuiPluginListScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
                onLeft={Actions.pop}
                route={{ params: { direction: 'sell' } }}
              />
              <Scene
                key="pluginViewSell"
                component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
                navTransparent
                renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
                renderLeftButton={PluginBackButton}
                // @ts-expect-error
                renderRightButton={<HeaderTextButton type="exit" placement="right" />}
                hideTabBar
              />
            </Stack>
            <Stack key="coinRanking">
              <Scene
                key="coinRanking"
                component={withNavigation(ifLoggedIn(CoinRankingScene))}
                navTransparent
                // @ts-expect-error
                renderTitle={<EdgeLogoHeader />}
                // @ts-expect-error
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />
              <Scene
                key="coinRankingDetails"
                component={withNavigation(ifLoggedIn(CoinRankingDetailsScene))}
                navTransparent
                // @ts-expect-error
                renderTitle={<EdgeLogoHeader />}
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />
            </Stack>
            <Stack key="exchange">
              <Scene
                key="exchangeScene"
                component={withNavigation(ifLoggedIn(CryptoExchangeScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
                onEnter={() => this.props.checkEnabledExchanges()}
              />
              <Scene
                key="exchangeQuoteProcessing"
                component={withNavigation(ifLoggedIn(CryptoExchangeQuoteProcessingScreen))}
                navTransparent
                hideTabBar
                // @ts-expect-error
                renderLeftButton={this.renderEmptyButton()}
                // @ts-expect-error
                renderRightButton={this.renderEmptyButton()}
              />
              <Scene
                key="exchangeQuote"
                component={withNavigation(ifLoggedIn(CryptoExchangeQuote))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<BackButton onPress={this.handleBack} />}
              />
              <Scene
                key="exchangeSuccess"
                component={withNavigation(ifLoggedIn(CryptoExchangeSuccessScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={this.renderEmptyButton()}
              />
            </Stack>
            <Stack key="extraTab">
              <Scene
                key="extraTab"
                component={withNavigation(ifLoggedIn(ExtraTabScene))}
                navTransparent
                // @ts-expect-error
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                // @ts-expect-error
                renderRightButton={<SideMenuButton />}
              />
            </Stack>
          </Tabs>

          <Stack key="confirmScene" hideTabBar>
            <Scene
              key="confirmScene"
              component={withNavigation(ifLoggedIn(ConfirmScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
            />
          </Stack>

          <Stack key="request" hideTabBar>
            <Scene
              key="request"
              component={withNavigation(ifLoggedIn(RequestScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
            />
            <Scene
              key="fioRequestConfirmation"
              component={withNavigation(ifLoggedIn(FioRequestConfirmationScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.fio_confirm_request_header} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key="send" hideTabBar>
            <Scene
              key="send"
              component={withNavigation(ifLoggedIn(SendScene))}
              navTransparent
              onEnter={props => {
                this.props.checkAndShowGetCryptoModal(props.navigation, props.route.params.selectedWalletId, props.route.params.selectedCurrencyCode)
              }}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
            />
            <Scene
              key="changeMiningFee"
              component={withNavigation(ifLoggedIn(ChangeMiningFeeScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<HeaderTextButton type="help" placement="right" />}
            />
          </Stack>

          <Stack key="send2" hideTabBar>
            <Scene
              key="send2"
              component={withNavigation(ifLoggedIn(SendScene2))}
              navTransparent
              onEnter={props => {
                this.props.checkAndShowGetCryptoModal(props.navigation, props.route.params.walletId, props.route.params.spendInfo?.currencyCode)
              }}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
            />
            <Scene
              key="changeMiningFee2"
              component={withNavigation(ifLoggedIn(ChangeMiningFeeScene2))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<HeaderTextButton type="help" placement="right" />}
            />
          </Stack>

          <Stack key="passwordRecovery" hideTabBar>
            <Scene
              key="passwordRecovery"
              component={withNavigation(ifLoggedIn(ChangeRecoveryScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_password_recovery} />}
              // @ts-expect-error
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
              // @ts-expect-error
              renderTitle=""
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack
            key="settingsOverviewTab"
            // @ts-expect-error
            hideDrawerButton
          >
            <Scene
              key="settingsOverview"
              component={withNavigation(ifLoggedIn(SettingsScene))}
              navTransparent
              onEnter={() => this.props.showReEnableOtpModal()}
              renderTitle={() => <HeaderTitle title={s.strings.title_settings} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
            />
            <Scene
              key="changePassword"
              component={withNavigation(ifLoggedIn(ChangePasswordScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_change_password} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="changePin"
              component={withNavigation(ifLoggedIn(ChangePinScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_change_pin} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="otpSetup"
              component={withNavigation(ifLoggedIn(OtpSettingsScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_otp} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="passwordRecovery"
              component={withNavigation(ifLoggedIn(ChangeRecoveryScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_password_recovery} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="spendingLimits"
              component={withNavigation(ifLoggedIn(SpendingLimitsScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.spending_limits} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="exchangeSettings"
              component={withNavigation(ifLoggedIn(SwapSettingsScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.settings_exchange_settings} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="currencySettings"
              component={withNavigation(ifLoggedIn(CurrencySettingsScene))}
              navTransparent
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.route.params.currencyInfo} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="promotionSettings"
              component={withNavigation(ifLoggedIn(PromotionSettingsScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_promotion_settings} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="defaultFiatSetting"
              component={withNavigation(ifLoggedIn(DefaultFiatSettingScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key="notificationSettings"
              component={withNavigation(ifLoggedIn(NotificationScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.settings_notifications} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key="currencyNotificationSettings"
              component={withNavigation(ifLoggedIn(CurrencyNotificationScene))}
              navTransparent
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.route.params.currencyInfo} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack
            key="pluginView"
            // @ts-expect-error
            hideDrawerButton
          >
            <Scene
              key="pluginView"
              component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
              renderLeftButton={PluginBackButton}
              // @ts-expect-error
              renderRightButton={<HeaderTextButton type="exit" placement="right" />}
            />
          </Stack>

          <Stack key="termsOfService">
            <Scene
              key="termsOfService"
              component={withNavigation(ifLoggedIn(TermsOfServiceComponent))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_terms_of_service} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioAddressList">
            <Scene
              key="fioAddressList"
              component={withNavigation(ifLoggedIn(FioAddressListScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioAddressRegister">
            <Scene
              key="fioAddressRegister"
              component={withNavigation(ifLoggedIn(FioAddressRegisterScene))}
              navTransparent
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioAddressRegisterSelectWallet">
            <Scene
              key="fioAddressRegisterSelectWallet"
              component={withNavigation(ifLoggedIn(FioAddressRegisterSelectWalletScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_fio_address_confirmation} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioDomainRegister">
            <Scene
              key="fioDomainRegister"
              component={withNavigation(ifLoggedIn(FioDomainRegisterScene))}
              navTransparent
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="fioDomainRegisterSelectWallet"
              component={withNavigation(ifLoggedIn(FioDomainRegisterSelectWalletScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_register_fio_domain} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key="fioDomainConfirm"
              component={withNavigation(ifLoggedIn(FioNameConfirmScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioNameConfirm">
            <Scene
              key="fioNameConfirm"
              component={withNavigation(ifLoggedIn(FioNameConfirmScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioAddressDetails">
            <Scene
              key="fioAddressDetails"
              component={withNavigation(ifLoggedIn(FioAddressDetailsScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.fioAddressName} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
            />
            <Scene
              key="fioConnectToWalletsConfirm"
              component={withNavigation(ifLoggedIn(FioConnectWalletConfirmScene))}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_fio_connect_to_wallet} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioAddressSettings">
            <Scene
              key="fioAddressSettings"
              component={withNavigation(FioAddressSettingsScene)}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_fio_address_settings} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioAddressRegisterSuccess">
            <Scene
              key="fioAddressRegisterSuccess"
              component={withNavigation(ifLoggedIn(FioAddressRegisteredScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.fioName} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              // @ts-expect-error
              renderLeftButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack key="fioDomainSettings">
            <Scene
              key="fioDomainSettings"
              component={withNavigation(FioDomainSettingsScene)}
              navTransparent
              renderTitle={() => <HeaderTitle title={s.strings.title_fio_domain_settings} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="fioRequestList">
            <Scene
              key="fioRequestList"
              component={withNavigation(ifLoggedIn(FioRequestListScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="fioRequestApproved"
              component={withNavigation(ifLoggedIn(TransactionDetailsScene))}
              navTransparent
              onEnter={() => this.props.requestPermission('contacts')}
              clone
              renderTitle={props => <TransactionDetailsTitle edgeTransaction={props.route.params.edgeTransaction} />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key="fioSentRequestDetails">
            <Scene
              key="fioSentRequestDetails"
              component={withNavigation(ifLoggedIn(FioSentRequestDetailsScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="wcConnections">
            <Scene
              key="wcConnections"
              component={withNavigation(ifLoggedIn(WcConnectionsScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="wcDisconnect"
              component={withNavigation(ifLoggedIn(WcDisconnectScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="wcConnect"
              component={withNavigation(ifLoggedIn(WcConnectScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="loan">
            <Scene
              key="loanDashboard"
              component={withNavigation(ifLoggedIn(LoanDashboardScene))}
              navTransparent
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="loanCreate"
              component={withNavigation(ifLoggedIn(LoanCreateScene))}
              navTransparent
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="loanCreateConfirmation"
              component={withNavigation(ifLoggedIn(LoanCreateConfirmationScene))}
              navTransparent
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="loanDetails"
              component={withNavigation(ifLoggedIn(LoanDetailsScene))}
              navTransparent
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="loanManage"
              component={withNavigation(ifLoggedIn(LoanManageScene))}
              navTransparent
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={PluginBackButton}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
            />
            <Scene
              key="loanClose"
              component={withNavigation(ifLoggedIn(LoanCloseScene))}
              navTransparent
              // @ts-expect-error
              renderTitle={<EdgeLogoHeader />}
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="loanStatus"
              component={withNavigation(ifLoggedIn(LoanStatusScene))}
              navTransparent
              // @ts-expect-error
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              // @ts-expect-error
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
    return Actions.currentScene === sceneKey
  }

  handleEmpty = () => null

  handleBack = () => {
    if (this.isCurrentScene('login')) {
      return false
    }
    if (this.isCurrentScene('walletList')) {
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
      Actions.popTo('exchange')
      return true
    }
    if (this.isCurrentScene('fioAddressRegister')) {
      if (Actions.currentParams.noAddresses) {
        Actions.jump('walletList', {})
        return true
      }
    }
    if (this.isCurrentScene('fioAddressRegisterSelectWallet')) {
      if (Actions.currentParams.isFallback) {
        Actions.popTo('fioAddressRegister')
        return true
      }
    }
    Actions.pop()
    return true
  }
}

export const Main = connect<{}, DispatchProps, {}>(
  state => ({}),
  dispatch => ({
    // Navigation actions:
    logout(username?: string): void {
      dispatch(logoutRequest(username))
    },

    // Things to do when we enter certain scenes:
    checkAndShowGetCryptoModal(navigation: NavigationBase, selectedWalletId?: string, selectedCurrencyCode?: string) {
      dispatch(checkAndShowGetCryptoModal(navigation, selectedWalletId, selectedCurrencyCode))
    },
    checkEnabledExchanges() {
      dispatch(checkEnabledExchanges())
    },
    requestPermission(permission: Permission) {
      requestPermission(permission)
    },
    showReEnableOtpModal() {
      dispatch(showReEnableOtpModal())
    }
  })
)(MainComponent)
