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
import { CreateWalletChoiceComponent } from '../components/scenes/CreateWalletChoiceScene.js'
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
import {
  ADD_TOKEN,
  CHANGE_MINING_FEE,
  CHANGE_PASSWORD,
  CHANGE_PIN,
  CREATE_WALLET_ACCOUNT_SELECT,
  CREATE_WALLET_ACCOUNT_SETUP,
  CREATE_WALLET_CHOICE,
  CREATE_WALLET_IMPORT,
  CREATE_WALLET_NAME,
  CREATE_WALLET_REVIEW,
  CREATE_WALLET_SELECT_CRYPTO,
  CREATE_WALLET_SELECT_FIAT,
  CURRENCY_NOTIFICATION_SETTINGS,
  CURRENCY_SETTINGS,
  DEFAULT_FIAT_SETTING,
  EDGE,
  EDGE_LOGIN,
  EDIT_TOKEN,
  EXCHANGE,
  EXCHANGE_QUOTE_PROCESSING_SCENE,
  EXCHANGE_QUOTE_SCENE,
  EXCHANGE_SCENE,
  EXCHANGE_SETTINGS,
  EXCHANGE_SUCCESS_SCENE,
  FIO_ADDRESS_DETAILS,
  FIO_ADDRESS_LIST,
  FIO_ADDRESS_REGISTER,
  FIO_ADDRESS_REGISTER_SELECT_WALLET,
  FIO_ADDRESS_REGISTER_SUCCESS,
  FIO_ADDRESS_SETTINGS,
  FIO_CONNECT_TO_WALLETS_CONFIRM,
  FIO_DOMAIN_CONFIRM,
  FIO_DOMAIN_REGISTER,
  FIO_DOMAIN_REGISTER_SELECT_WALLET,
  FIO_DOMAIN_SETTINGS,
  FIO_NAME_CONFIRM,
  FIO_REQUEST_APPROVED,
  FIO_REQUEST_CONFIRMATION,
  FIO_REQUEST_LIST,
  FIO_SENT_REQUEST_DETAILS,
  LOGIN,
  MANAGE_TOKENS,
  MANAGE_TOKENS_NOT_USED,
  NOTIFICATION_SETTINGS,
  OTP_REPAIR_SCENE,
  OTP_SETUP,
  PLUGIN_BUY,
  PLUGIN_SELL,
  PLUGIN_VIEW,
  PROMOTION_SETTINGS,
  RECOVER_PASSWORD,
  REQUEST,
  ROOT,
  SECURITY_ALERTS_SCENE,
  SEND,
  SETTINGS_OVERVIEW,
  SETTINGS_OVERVIEW_TAB,
  SPENDING_LIMITS,
  STAKING_CHANGE,
  STAKING_OVERVIEW,
  TERMS_OF_SERVICE,
  TRANSACTION_DETAILS,
  TRANSACTION_LIST,
  TRANSACTIONS_EXPORT,
  WALLET_LIST,
  WALLET_LIST_SCENE
} from '../constants/SceneKeys.js'
import s from '../locales/strings.js'
import { ifLoggedIn } from '../modules/UI/components/LoginStatus/LoginStatus.js'
import { type Permission } from '../reducers/PermissionsReducer.js'
import { connect } from '../types/reactRedux.js'
import { Actions, withNavigation } from '../types/routerTypes.js'
import { scale } from '../util/scaling.js'
import { logEvent } from '../util/tracking.js'
import { AirshipToast } from './common/AirshipToast.js'
import { BackButton } from './navigation/BackButton.js'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle.js'
import { EdgeLogoHeader } from './navigation/EdgeLogoHeader.js'
import { handlePluginBack, renderPluginBackButton } from './navigation/GuiPluginBackButton.js'
import { HeaderTextButton } from './navigation/HeaderTextButton.js'
import { HeaderTitle } from './navigation/HeaderTitle.js'
import { SideMenuButton } from './navigation/SideMenuButton.js'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle.js'
import { AddTokenScene } from './scenes/AddTokenScene.js'
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
import { GuiPluginListScene } from './scenes/GuiPluginListScene.js'
import { GuiPluginViewScene } from './scenes/GuiPluginViewScene.js'
import { LoginScene } from './scenes/LoginScene.js'
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
import { StakingChangeScene } from './scenes/StakingChangeScene'
import { StakingOverviewScene } from './scenes/StakingOverviewScene.js'
import { TermsOfServiceComponent } from './scenes/TermsOfServiceScene.js'
import { TransactionDetailsScene } from './scenes/TransactionDetailsScene.js'
import { TransactionList } from './scenes/TransactionListScene.js'
import { WcConnectionsScene } from './scenes/WcConnectionsScene'
import { WcConnectScene } from './scenes/WcConnectScene'
import { WcDisconnectScene } from './scenes/WcDisconnectScene'
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
  dispatchEnableScan: () => void,
  requestPermission: (permission: Permission) => void,
  showReEnableOtpModal: () => void
}

type Props = DispatchProps

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
          <Stack key={ROOT} hideNavBar panHandlers={null}>
            <Scene key={LOGIN} component={withNavigation(LoginScene)} initial />
            <Scene
              key={EDGE_LOGIN}
              component={withNavigation(ifLoggedIn(EdgeLoginScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_edge_login} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<HeaderTextButton type="help" placement="right" />}
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
        key={TRANSACTION_DETAILS}
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
    return (
      <Drawer
        hideTabBar
        drawerBackgroundColor="none"
        key={EDGE}
        hideNavBar
        contentComponent={ControlPanel}
        hideDrawerButton
        drawerPosition="right"
        drawerWidth={scale(270)}
      >
        {/* Wrapper Scene needed to fix a bug where the tabs would reload as a modal ontop of itself */}
        <Scene key="AllMyTabs" hideNavBar>
          <Tabs key={EDGE} swipeEnabled={false} tabBarPosition="bottom" tabBarComponent={MenuTab}>
            <Stack key={WALLET_LIST}>
              <Scene
                key={WALLET_LIST_SCENE}
                component={withNavigation(ifLoggedIn(WalletListScene))}
                navTransparent
                renderTitle={<EdgeLogoHeader />}
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key={CREATE_WALLET_CHOICE}
                component={withNavigation(ifLoggedIn(CreateWalletChoiceComponent))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.title_create_wallet} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={CREATE_WALLET_IMPORT}
                component={withNavigation(ifLoggedIn(CreateWalletImportScene))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.create_wallet_import_title} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={CREATE_WALLET_SELECT_CRYPTO}
                component={withNavigation(ifLoggedIn(CreateWalletSelectCryptoScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={CREATE_WALLET_NAME}
                component={withNavigation(ifLoggedIn(CreateWalletName))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={CREATE_WALLET_SELECT_FIAT}
                component={withNavigation(ifLoggedIn(CreateWalletSelectFiatScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={CREATE_WALLET_REVIEW}
                component={withNavigation(ifLoggedIn(CreateWalletReviewScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={CREATE_WALLET_ACCOUNT_SETUP}
                component={withNavigation(ifLoggedIn(CreateWalletAccountSetupScene))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.create_wallet_create_account} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<HeaderTextButton type="help" placement="right" />}
              />

              <Scene
                key={CREATE_WALLET_ACCOUNT_SELECT}
                component={withNavigation(ifLoggedIn(CreateWalletAccountSelectScene))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.create_wallet_account_activate} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<HeaderTextButton type="help" placement="right" />}
              />

              <Scene
                key={TRANSACTION_LIST}
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
                key={STAKING_OVERVIEW}
                navTransparent
                component={ifLoggedIn(StakingOverviewScene)}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key={STAKING_CHANGE}
                navTransparent
                component={ifLoggedIn(StakingChangeScene)}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key={MANAGE_TOKENS}
                component={withNavigation(ifLoggedIn(ManageTokensScene))}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
                navTransparent
                renderTitle=""
                animation="fade"
                duration={600}
              />
              <Scene
                key={ADD_TOKEN}
                component={withNavigation(ifLoggedIn(AddTokenScene))}
                navTransparent
                onLeft={Actions.pop}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
                renderTitle={<HeaderTitle title={s.strings.title_add_token} />}
              />
              <Scene
                key={EDIT_TOKEN}
                component={withNavigation(ifLoggedIn(EditTokenScene))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
                renderTitle={<HeaderTitle title={s.strings.title_edit_token} />}
              />
              <Scene
                key={TRANSACTIONS_EXPORT}
                component={withNavigation(ifLoggedIn(TransactionsExportScene))}
                navTransparent
                renderTitle={<HeaderTitle title={s.strings.title_export_transactions} />}
                renderLeftButton={<BackButton onPress={this.handleBack} />}
                renderRightButton={this.renderEmptyButton()}
              />
            </Stack>
            <Stack key={PLUGIN_BUY}>
              <Scene
                key={PLUGIN_BUY}
                component={withNavigation(ifLoggedIn(GuiPluginListScene))}
                navTransparent
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                renderRightButton={<SideMenuButton />}
                onLeft={Actions.pop}
                route={{ params: { direction: 'buy' } }}
              />
              <Scene
                key={PLUGIN_VIEW}
                component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
                navTransparent
                renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
                renderLeftButton={renderPluginBackButton()}
                renderRightButton={<HeaderTextButton type="exit" placement="right" />}
                hideTabBar
              />
            </Stack>
            <Stack key={PLUGIN_SELL}>
              <Scene
                key={PLUGIN_SELL}
                component={withNavigation(ifLoggedIn(GuiPluginListScene))}
                navTransparent
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                renderRightButton={<SideMenuButton />}
                onLeft={Actions.pop}
                route={{ params: { direction: 'sell' } }}
              />
              <Scene
                key={PLUGIN_VIEW}
                component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
                navTransparent
                renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
                renderLeftButton={renderPluginBackButton()}
                renderRightButton={<HeaderTextButton type="exit" placement="right" />}
                hideTabBar
              />
            </Stack>
            <Stack key={EXCHANGE}>
              <Scene
                key={EXCHANGE_SCENE}
                component={withNavigation(ifLoggedIn(CryptoExchangeScene))}
                navTransparent
                renderLeftButton={<HeaderTextButton type="help" placement="left" />}
                renderRightButton={<SideMenuButton />}
                onEnter={() => this.props.checkEnabledExchanges()}
              />
              <Scene
                key={EXCHANGE_QUOTE_PROCESSING_SCENE}
                component={withNavigation(ifLoggedIn(CryptoExchangeQuoteProcessingScreen))}
                navTransparent
                hideTabBar
                renderLeftButton={this.renderEmptyButton()}
                renderRightButton={this.renderEmptyButton()}
              />
              <Scene
                key={EXCHANGE_QUOTE_SCENE}
                component={withNavigation(ifLoggedIn(CryptoExchangeQuote))}
                navTransparent
                renderLeftButton={<BackButton onPress={this.handleBack} />}
              />
              <Scene
                key={EXCHANGE_SUCCESS_SCENE}
                component={withNavigation(ifLoggedIn(CryptoExchangeSuccessScene))}
                navTransparent
                renderLeftButton={this.renderEmptyButton()}
              />
            </Stack>
          </Tabs>

          <Stack key={REQUEST} hideTabBar>
            <Scene
              key={REQUEST}
              component={withNavigation(ifLoggedIn(Request))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              renderTitle={<EdgeLogoHeader />}
            />
            <Scene
              key={FIO_REQUEST_CONFIRMATION}
              component={withNavigation(ifLoggedIn(FioRequestConfirmationScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.fio_confirm_request_header} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key={SEND} hideTabBar>
            <Scene
              key={SEND}
              component={withNavigation(ifLoggedIn(SendScene))}
              navTransparent
              onEnter={props => {
                this.props.checkAndShowGetCryptoModal(props.route.params.selectedWalletId, props.route.params.selectedCurrencyCode)
              }}
              onExit={this.props.dispatchDisableScan}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
            />
            <Scene
              key={CHANGE_MINING_FEE}
              component={withNavigation(ifLoggedIn(ChangeMiningFeeScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<HeaderTextButton type="help" placement="right" />}
            />
          </Stack>

          <Stack key={RECOVER_PASSWORD} hideTabBar>
            <Scene
              key={RECOVER_PASSWORD}
              component={withNavigation(ifLoggedIn(ChangeRecoveryScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_password_recovery} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
            />
          </Stack>

          <Stack key={OTP_REPAIR_SCENE} hideNavBar>
            <Scene key={OTP_REPAIR_SCENE} component={withNavigation(ifLoggedIn(OtpRepairScene))} navTransparent />
          </Stack>

          <Stack key={SECURITY_ALERTS_SCENE} hideNavBar>
            <Scene key={SECURITY_ALERTS_SCENE} component={withNavigation(ifLoggedIn(SecurityAlertsScene))} navTransparent />
          </Stack>

          <Stack key={MANAGE_TOKENS} hideTabBar>
            <Scene
              key={MANAGE_TOKENS_NOT_USED}
              component={withNavigation(ifLoggedIn(ManageTokensScene))}
              navTransparent
              renderTitle=""
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />

            <Scene
              key={ADD_TOKEN}
              component={withNavigation(ifLoggedIn(AddTokenScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_add_token} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack key={SETTINGS_OVERVIEW_TAB} hideDrawerButton>
            <Scene
              key={SETTINGS_OVERVIEW}
              component={withNavigation(ifLoggedIn(SettingsScene))}
              navTransparent
              onEnter={() => this.props.showReEnableOtpModal()}
              renderTitle={<HeaderTitle title={s.strings.title_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
            />
            <Scene
              key={CHANGE_PASSWORD}
              component={withNavigation(ifLoggedIn(ChangePasswordScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_change_password} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={CHANGE_PIN}
              component={withNavigation(ifLoggedIn(ChangePinScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_change_pin} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={OTP_SETUP}
              component={withNavigation(ifLoggedIn(OtpSettingsScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_otp} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={RECOVER_PASSWORD}
              component={withNavigation(ifLoggedIn(ChangeRecoveryScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_password_recovery} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={SPENDING_LIMITS}
              component={withNavigation(ifLoggedIn(SpendingLimitsScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.spending_limits} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={EXCHANGE_SETTINGS}
              component={withNavigation(ifLoggedIn(SwapSettingsScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.settings_exchange_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={CURRENCY_SETTINGS}
              component={withNavigation(ifLoggedIn(CurrencySettingsScene))}
              navTransparent
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.route.params.currencyInfo} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={PROMOTION_SETTINGS}
              component={withNavigation(ifLoggedIn(PromotionSettingsScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_promotion_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={DEFAULT_FIAT_SETTING}
              component={withNavigation(ifLoggedIn(DefaultFiatSettingScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_default_fiat} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={NOTIFICATION_SETTINGS}
              component={withNavigation(ifLoggedIn(NotificationScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.settings_notifications} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key={CURRENCY_NOTIFICATION_SETTINGS}
              component={withNavigation(ifLoggedIn(CurrencyNotificationScene))}
              navTransparent
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.route.params.currencyInfo} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={PLUGIN_VIEW} hideDrawerButton>
            <Scene
              key={PLUGIN_VIEW}
              component={withNavigation(ifLoggedIn(GuiPluginViewScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.plugin.displayName} />}
              renderLeftButton={renderPluginBackButton()}
              renderRightButton={<HeaderTextButton type="exit" placement="right" />}
            />
          </Stack>

          <Stack key={TERMS_OF_SERVICE}>
            <Scene
              key={TERMS_OF_SERVICE}
              component={withNavigation(ifLoggedIn(TermsOfServiceComponent))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_terms_of_service} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_ADDRESS_LIST}>
            <Scene
              key={FIO_ADDRESS_LIST}
              component={withNavigation(ifLoggedIn(FioAddressListScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_ADDRESS_REGISTER}>
            <Scene
              key={FIO_ADDRESS_REGISTER}
              component={withNavigation(ifLoggedIn(FioAddressRegisterScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_ADDRESS_REGISTER_SELECT_WALLET}>
            <Scene
              key={FIO_ADDRESS_REGISTER_SELECT_WALLET}
              component={withNavigation(ifLoggedIn(FioAddressRegisterSelectWalletScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_fio_address_confirmation} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_DOMAIN_REGISTER}>
            <Scene
              key={FIO_DOMAIN_REGISTER}
              component={withNavigation(ifLoggedIn(FioDomainRegisterScene))}
              navTransparent
              renderTitle={<EdgeLogoHeader />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key={FIO_DOMAIN_REGISTER_SELECT_WALLET}
              component={withNavigation(ifLoggedIn(FioDomainRegisterSelectWalletScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_register_fio_domain} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key={FIO_DOMAIN_CONFIRM}
              component={withNavigation(ifLoggedIn(FioNameConfirmScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_NAME_CONFIRM}>
            <Scene
              key={FIO_NAME_CONFIRM}
              component={withNavigation(ifLoggedIn(FioNameConfirmScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_ADDRESS_DETAILS}>
            <Scene
              key={FIO_ADDRESS_DETAILS}
              component={withNavigation(ifLoggedIn(FioAddressDetailsScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.fioAddressName} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
            />
            <Scene
              key={FIO_CONNECT_TO_WALLETS_CONFIRM}
              component={withNavigation(ifLoggedIn(FioConnectWalletConfirmScene))}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_fio_connect_to_wallet} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_ADDRESS_SETTINGS}>
            <Scene
              key={FIO_ADDRESS_SETTINGS}
              component={withNavigation(FioAddressSettingsScene)}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_fio_address_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_ADDRESS_REGISTER_SUCCESS}>
            <Scene
              key={FIO_ADDRESS_REGISTER_SUCCESS}
              component={withNavigation(ifLoggedIn(FioAddressRegisteredScene))}
              navTransparent
              renderTitle={props => <HeaderTitle title={props.route.params.fioName} />}
              renderRightButton={<SideMenuButton />}
              renderLeftButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack key={FIO_DOMAIN_SETTINGS}>
            <Scene
              key={FIO_DOMAIN_SETTINGS}
              component={withNavigation(FioDomainSettingsScene)}
              navTransparent
              renderTitle={<HeaderTitle title={s.strings.title_fio_domain_settings} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={FIO_REQUEST_LIST}>
            <Scene
              key={FIO_REQUEST_LIST}
              component={withNavigation(ifLoggedIn(FioRequestListScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key={FIO_REQUEST_APPROVED}
              component={withNavigation(ifLoggedIn(TransactionDetailsScene))}
              navTransparent
              onEnter={() => this.props.requestPermission('contacts')}
              clone
              renderTitle={props => <TransactionDetailsTitle edgeTransaction={props.route.params.edgeTransaction} />}
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
            />
          </Stack>

          <Stack key={FIO_SENT_REQUEST_DETAILS}>
            <Scene
              key={FIO_SENT_REQUEST_DETAILS}
              component={withNavigation(ifLoggedIn(FioSentRequestDetailsScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key="wcConnections">
            <Scene
              key="wcConnections"
              component={withNavigation(ifLoggedIn(WcConnectionsScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="wcDisconnect"
              component={withNavigation(ifLoggedIn(WcDisconnectScene))}
              navTransparent
              renderLeftButton={<BackButton onPress={this.handleBack} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
            <Scene
              key="wcConnect"
              component={withNavigation(ifLoggedIn(WcConnectScene))}
              navTransparent
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
    return Actions.currentScene === sceneKey
  }

  handleEmpty = () => null

  handleBack = () => {
    if (this.isCurrentScene(LOGIN)) {
      return false
    }
    if (this.isCurrentScene(WALLET_LIST_SCENE)) {
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
    if (this.isCurrentScene(EXCHANGE_QUOTE_SCENE)) {
      Actions.popTo(EXCHANGE_SCENE)
      return true
    }
    if (this.isCurrentScene(PLUGIN_VIEW)) {
      handlePluginBack()
      return true
    }
    if (this.isCurrentScene(FIO_ADDRESS_REGISTER)) {
      if (Actions.currentParams.noAddresses) {
        Actions.jump(WALLET_LIST_SCENE)
        return true
      }
    }
    if (this.isCurrentScene(FIO_ADDRESS_REGISTER_SELECT_WALLET)) {
      if (Actions.currentParams.isFallback) {
        Actions.popTo(FIO_ADDRESS_REGISTER)
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
