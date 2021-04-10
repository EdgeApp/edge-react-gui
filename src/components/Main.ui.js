// @flow

import * as React from 'react'
import { YellowBox } from 'react-native'
import { Actions, Drawer, Router, Scene, Stack, Tabs } from 'react-native-router-flux'
import { connect } from 'react-redux'

import ENV from '../../env.json'
import { checkEnabledExchanges } from '../actions/CryptoExchangeActions.js'
import { checkAndShowGetCryptoModal } from '../actions/ScanActions.js'
import { openDrawer } from '../actions/ScenesActions.js'
import { showReEnableOtpModal } from '../actions/SettingsActions.js'
import { CreateWalletChoiceComponent } from '../components/scenes/CreateWalletChoiceScene.js'
import { CreateWalletImportScene } from '../components/scenes/CreateWalletImportScene.js'
import { CreateWalletReviewScene } from '../components/scenes/CreateWalletReviewScene.js'
import { CreateWalletSelectCryptoScene } from '../components/scenes/CreateWalletSelectCryptoScene.js'
import { CreateWalletSelectFiatScene } from '../components/scenes/CreateWalletSelectFiatScene.js'
import { CryptoExchangeScene } from '../components/scenes/CryptoExchangeScene.js'
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
import ExchangeDropMenu from '../connectors/components/HeaderMenuExchangeConnector'
import RequestDropMenu from '../connectors/components/HeaderMenuRequestConnector'
import AddToken from '../connectors/scenes/AddTokenConnector.js'
import { CreateWalletAccountSelectConnector } from '../connectors/scenes/CreateWalletAccountSelectConnector.js'
import { CreateWalletAccountSetupConnector } from '../connectors/scenes/CreateWalletAccountSetupConnector.js'
import { CryptoExchangeQuoteConnector } from '../connectors/scenes/CryptoExchangeQuoteConnector.js'
import EdgeLoginSceneConnector from '../connectors/scenes/EdgeLoginSceneConnector'
import ManageTokens from '../connectors/scenes/ManageTokensConnector.js'
import Scan from '../connectors/scenes/ScanConnector'
import SendConfirmation from '../connectors/scenes/SendConfirmationConnector.js'
import SendConfirmationOptions from '../connectors/SendConfirmationOptionsConnector.js'
import SpendingLimitsConnector from '../connectors/SpendingLimitsConnector.js'
import * as Constants from '../constants/indexConstants'
import s from '../locales/strings.js'
import { registerDevice } from '../modules/Device/action'
import { logoutRequest } from '../modules/Login/action.js'
import ControlPanel from '../modules/UI/components/ControlPanel/ControlPanelConnector'
import { ifLoggedIn } from '../modules/UI/components/LoginStatus/LoginStatus.js'
import { type Permission } from '../reducers/PermissionsReducer.js'
import { type Dispatch, type RootState } from '../types/reduxTypes.js'
import { scale } from '../util/scaling.js'
import { logEvent } from '../util/tracking.js'
import { AirshipToast } from './common/AirshipToast.js'
import { BackButton } from './navigation/BackButton.js'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle.js'
import { EdgeLogoHeader } from './navigation/EdgeLogoHeader.js'
import { handlePluginBack, renderPluginBackButton } from './navigation/GuiPluginBackButton.js'
import { HeaderTitle } from './navigation/HeaderTitle.js'
import { SideMenuButton } from './navigation/SideMenuButton.js'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle.js'
import { ChangeMiningFeeScene } from './scenes/ChangeMiningFeeScene.js'
import { ChangePasswordScene } from './scenes/ChangePasswordScene.js'
import { ChangePinScene } from './scenes/ChangePinScene.js'
import { CreateWalletName } from './scenes/CreateWalletNameScene.js'
import { CryptoExchangeQuoteProcessingScreenComponent } from './scenes/CryptoExchangeQuoteProcessingScene.js'
import { CurrencyNotificationScene } from './scenes/CurrencyNotificationScene'
import { EditTokenScene } from './scenes/EditTokenScene.js'
import { FioDomainRegisterScene } from './scenes/FioDomainRegisterScene'
import { FioDomainRegisterSelectWalletScene } from './scenes/FioDomainRegisterSelectWalletScene'
import { FioNameConfirmScene } from './scenes/FioNameConfirmScene'
import { GuiPluginListScene } from './scenes/GuiPluginListScene.js'
import { GuiPluginViewScene } from './scenes/GuiPluginViewScene.js'
import { LoginScene } from './scenes/LoginScene.js'
import { NotificationScene } from './scenes/NotificationScene'
import { OtpRepairScene } from './scenes/OtpRepairScene.js'
import { OtpSettingsScene } from './scenes/OtpSettingsScene.js'
import { ChangeRecoveryScene } from './scenes/PasswordRecoveryScene.js'
import { Request } from './scenes/RequestScene.js'
import { SecurityAlertsScene } from './scenes/SecurityAlertsScene.js'
import { SendScene } from './scenes/SendScene.js'
import { SettingsScene } from './scenes/SettingsScene.js'
import { TermsOfServiceComponent } from './scenes/TermsOfServiceScene.js'
import { TransactionDetailsScene } from './scenes/TransactionDetailsScene.js'
import { TransactionList } from './scenes/TransactionListScene.js'
import { Airship } from './services/AirshipInstance.js'
import { HeaderTextButton } from './themed/HeaderTextButton.js'
import { MenuTab } from './themed/MenuTab.js'

const RouterWithRedux = connect()(Router)

type DispatchProps = {
  registerDevice(): void,

  // Navigation actions:
  logout(username?: string): void,
  openDrawer(): void,

  // Things to do when we enter certain scenes:
  checkAndShowGetCryptoModal(selectedWalletId?: string, selectedCurrencyCode?: string): void,
  checkEnabledExchanges(): void,
  dispatchDisableScan(): void,
  dispatchEnableScan(): void,
  requestPermission(permission: Permission): void,
  showReEnableOtpModal(): void
}

type StateProps = {}

type Props = DispatchProps & StateProps

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
          <Stack key={Constants.ROOT} hideNavBar panHandlers={null}>
            <Scene key={Constants.LOGIN} initial component={LoginScene} />
            <Scene
              key={Constants.EDGE_LOGIN}
              navTransparent
              component={ifLoggedIn(EdgeLoginSceneConnector)}
              renderTitle={<HeaderTitle title={s.strings.title_edge_login} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<HeaderTextButton type="help" />}
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
        key={Constants.TRANSACTION_DETAILS}
        navTransparent
        onEnter={() => this.props.requestPermission('contacts')}
        clone
        component={ifLoggedIn(TransactionDetailsScene)}
        renderTitle={props => <TransactionDetailsTitle edgeTransaction={props.edgeTransaction} />}
        renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
        renderRightButton={<SideMenuButton />}
      />
    )
  }

  renderTabView = () => {
    return (
      <Drawer key={Constants.EDGE} hideNavBar contentComponent={ControlPanel} hideDrawerButton drawerPosition="right" drawerWidth={scale(280)}>
        {/* Wrapper Scene needed to fix a bug where the tabs would reload as a modal ontop of itself */}
        <Scene key="AllMyTabs" hideNavBar>
          <Tabs key={Constants.EDGE} swipeEnabled={false} tabBarPosition="bottom" tabBarComponent={MenuTab}>
            <Stack key={Constants.WALLET_LIST}>
              <Scene
                key={Constants.WALLET_LIST_SCENE}
                navTransparent
                component={ifLoggedIn(WalletListScene)}
                renderTitle={<EdgeLogoHeader />}
                renderLeftButton={<HeaderTextButton type="help" />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key={Constants.CREATE_WALLET_CHOICE}
                navTransparent
                component={ifLoggedIn(CreateWalletChoiceComponent)}
                renderTitle={<HeaderTitle title={s.strings.title_create_wallet} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_wallets} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_IMPORT}
                navTransparent
                component={ifLoggedIn(CreateWalletImportScene)}
                renderTitle={<HeaderTitle title={s.strings.create_wallet_import_title} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_SELECT_CRYPTO}
                navTransparent
                component={ifLoggedIn(CreateWalletSelectCryptoScene)}
                renderTitle={<HeaderTitle title={s.strings.title_create_wallet_select_crypto} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_NAME}
                navTransparent
                component={ifLoggedIn(CreateWalletName)}
                renderTitle={<HeaderTitle title={s.strings.title_create_wallet} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_SELECT_FIAT}
                navTransparent
                component={ifLoggedIn(CreateWalletSelectFiatScene)}
                renderTitle={<HeaderTitle title={s.strings.title_create_wallet_select_fiat} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_REVIEW}
                navTransparent
                component={ifLoggedIn(CreateWalletReviewScene)}
                renderTitle={<HeaderTitle title={s.strings.title_create_wallet} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_ACCOUNT_SETUP}
                navTransparent
                component={ifLoggedIn(CreateWalletAccountSetupConnector)}
                renderTitle={<HeaderTitle title={s.strings.create_wallet_create_account} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={<HeaderTextButton type="help" />}
              />

              <Scene
                key={Constants.CREATE_WALLET_ACCOUNT_SELECT}
                navTransparent
                component={ifLoggedIn(CreateWalletAccountSelectConnector)}
                renderTitle={<HeaderTitle title={s.strings.create_wallet_account_activate} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={<HeaderTextButton type="help" />}
              />

              <Scene
                key={Constants.TRANSACTION_LIST}
                onEnter={() => {
                  this.props.requestPermission('contacts')
                }}
                navTransparent
                component={ifLoggedIn(TransactionList)}
                renderTitle={<HeaderTitle title=" " />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_wallets} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key={Constants.SCAN}
                navTransparent
                onEnter={props => {
                  this.props.requestPermission('camera')
                  this.props.dispatchEnableScan()
                }}
                onExit={this.props.dispatchDisableScan}
                component={ifLoggedIn(Scan)}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key={Constants.REQUEST}
                navTransparent
                component={ifLoggedIn(Request)}
                renderTitle={<EdgeLogoHeader />}
                renderRightButton={<SideMenuButton />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                hideTabBar
              />

              <Scene
                key={Constants.FIO_REQUEST_CONFIRMATION}
                navTransparent
                component={ifLoggedIn(FioRequestConfirmationScene)}
                renderTitle={<HeaderTitle title={s.strings.fio_confirm_request_header} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={<SideMenuButton />}
              />

              <Scene
                key={Constants.MANAGE_TOKENS}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={this.renderEmptyButton()}
                navTransparent
                component={ifLoggedIn(ManageTokens)}
                renderTitle={<HeaderTitle title={s.strings.title_manage_tokens} />}
                animation="fade"
                duration={600}
              />
              <Scene
                key={Constants.ADD_TOKEN}
                component={ifLoggedIn(AddToken)}
                navTransparent
                onLeft={Actions.pop}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={this.renderEmptyButton()}
                renderTitle={<HeaderTitle title={s.strings.title_add_token} />}
              />
              <Scene
                key={Constants.EDIT_TOKEN}
                component={ifLoggedIn(EditTokenScene)}
                navTransparent
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={this.renderEmptyButton()}
                renderTitle={<HeaderTitle title={s.strings.title_edit_token} />}
              />
              <Scene
                key={Constants.TRANSACTIONS_EXPORT}
                navTransparent
                component={ifLoggedIn(TransactionsExportScene)}
                renderTitle={<HeaderTitle title={s.strings.title_export_transactions} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_wallets} />}
                renderRightButton={this.renderEmptyButton()}
              />
            </Stack>

            <Stack key={Constants.PLUGIN_BUY}>
              <Scene
                key={Constants.PLUGIN_BUY}
                navTransparent
                component={ifLoggedIn(GuiPluginListScene)}
                renderLeftButton={<HeaderTextButton type="help" />}
                renderRightButton={<SideMenuButton />}
                onLeft={Actions.pop}
                direction="buy"
              />
              <Scene
                key={Constants.PLUGIN_VIEW}
                navTransparent
                component={ifLoggedIn(GuiPluginViewScene)}
                renderTitle={props => <HeaderTitle title={props.plugin.displayName} />}
                renderLeftButton={renderPluginBackButton()}
                renderRightButton={<HeaderTextButton type="exit" />}
                hideTabBar
              />
            </Stack>

            <Stack key={Constants.PLUGIN_SELL}>
              <Scene
                key={Constants.PLUGIN_SELL}
                navTransparent
                component={ifLoggedIn(GuiPluginListScene)}
                renderLeftButton={<HeaderTextButton type="help" />}
                renderRightButton={<SideMenuButton />}
                onLeft={Actions.pop}
                direction="sell"
              />
              <Scene
                key={Constants.PLUGIN_VIEW}
                navTransparent
                component={ifLoggedIn(GuiPluginViewScene)}
                renderTitle={props => <HeaderTitle title={props.plugin.displayName} />}
                renderLeftButton={renderPluginBackButton()}
                renderRightButton={<HeaderTextButton type="exit" />}
                hideTabBar
              />
            </Stack>

            <Stack key={Constants.EXCHANGE}>
              <Scene
                key={Constants.EXCHANGE_SCENE}
                navTransparent
                component={ifLoggedIn(CryptoExchangeScene)}
                renderTitle={<HeaderTitle title={s.strings.title_exchange} />}
                renderLeftButton={this.renderExchangeButton()}
                renderRightButton={<SideMenuButton />}
                onEnter={() => this.props.checkEnabledExchanges()}
              />
              <Scene
                key={Constants.EXCHANGE_QUOTE_PROCESSING_SCENE}
                navTransparent
                hideTabBar
                component={ifLoggedIn(CryptoExchangeQuoteProcessingScreenComponent)}
                renderTitle={<HeaderTitle title={s.strings.title_exchange} />}
                renderLeftButton={this.renderEmptyButton()}
                renderRightButton={this.renderEmptyButton()}
              />
              <Scene
                key={Constants.EXCHANGE_QUOTE_SCENE}
                navTransparent
                component={ifLoggedIn(CryptoExchangeQuoteConnector)}
                renderTitle={<HeaderTitle title={s.strings.title_exchange} />}
                renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
                renderRightButton={<SideMenuButton />}
              />
            </Stack>
          </Tabs>

          <Stack key={Constants.SEND_CONFIRMATION} hideTabBar>
            <Scene
              key={Constants.SEND_CONFIRMATION_NOT_USED}
              navTransparent
              hideTabBar
              panHandlers={null}
              component={ifLoggedIn(SendConfirmation)}
              renderTitle={<HeaderTitle showWalletNameOnly />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderSendConfirmationButton()}
            />
            <Scene
              key={Constants.CHANGE_MINING_FEE_SEND_CONFIRMATION}
              navTransparent
              component={ifLoggedIn(ChangeMiningFeeScene)}
              renderTitle={<HeaderTitle title={s.strings.title_change_mining_fee} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<HeaderTextButton type="help" />}
            />
          </Stack>

          <Stack key={Constants.SEND} hideTabBar>
            <Scene
              key={Constants.SEND}
              navTransparent
              onEnter={props => {
                this.props.checkAndShowGetCryptoModal(props.selectedWalletId, props.selectedCurrencyCode)
              }}
              onExit={this.props.dispatchDisableScan}
              component={ifLoggedIn(SendScene)}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
            />
            <Scene
              key={Constants.CHANGE_MINING_FEE_SEND_CONFIRMATION}
              navTransparent
              component={ifLoggedIn(ChangeMiningFeeScene)}
              renderTitle={<HeaderTitle title={s.strings.title_change_mining_fee} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<HeaderTextButton type="help" />}
            />
          </Stack>

          <Stack key={Constants.RECOVER_PASSWORD} hideTabBar>
            <Scene
              key={Constants.RECOVER_PASSWORD}
              navTransparent
              component={ifLoggedIn(ChangeRecoveryScene)}
              renderTitle={<HeaderTitle title={s.strings.title_password_recovery} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
            />
          </Stack>

          <Stack key={Constants.OTP_REPAIR_SCENE} hideNavBar>
            <Scene key={Constants.OTP_REPAIR_SCENE} navTransparent component={ifLoggedIn(OtpRepairScene)} />
          </Stack>

          <Stack key={Constants.SECURITY_ALERTS_SCENE} hideNavBar>
            <Scene key={Constants.SECURITY_ALERTS_SCENE} navTransparent component={ifLoggedIn(SecurityAlertsScene)} />
          </Stack>

          <Stack key={Constants.MANAGE_TOKENS} hideTabBar>
            <Scene
              key={Constants.MANAGE_TOKENS_NOT_USED}
              navTransparent
              component={ifLoggedIn(ManageTokens)}
              renderTitle={<HeaderTitle title={s.strings.title_manage_tokens} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />

            <Scene
              key={Constants.ADD_TOKEN}
              navTransparent
              component={ifLoggedIn(AddToken)}
              renderTitle={<HeaderTitle title={s.strings.title_add_token} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack key={Constants.PLUGIN_EARN_INTEREST}>
            <Scene
              key={Constants.PLUGIN_EARN_INTEREST}
              navTransparent
              component={ifLoggedIn(GuiPluginViewScene)}
              renderTitle={props => <HeaderTitle title={props.plugin.displayName} />}
              renderLeftButton={renderPluginBackButton()}
              renderRightButton={<HeaderTextButton type="exit" />}
              hideTabBar
            />
          </Stack>

          <Stack key={Constants.SETTINGS_OVERVIEW_TAB} hideDrawerButton>
            <Scene
              key={Constants.SETTINGS_OVERVIEW}
              navTransparent
              onEnter={() => this.props.showReEnableOtpModal()}
              component={ifLoggedIn(SettingsScene)}
              renderTitle={<HeaderTitle title={s.strings.title_settings} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.CHANGE_PASSWORD}
              navTransparent
              component={ifLoggedIn(ChangePasswordScene)}
              renderTitle={<HeaderTitle title={s.strings.title_change_password} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.CHANGE_PIN}
              navTransparent
              component={ifLoggedIn(ChangePinScene)}
              renderTitle={<HeaderTitle title={s.strings.title_change_pin} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.OTP_SETUP}
              navTransparent
              component={ifLoggedIn(OtpSettingsScene)}
              renderTitle={<HeaderTitle title={s.strings.title_otp} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.RECOVER_PASSWORD}
              navTransparent
              component={ifLoggedIn(ChangeRecoveryScene)}
              renderTitle={<HeaderTitle title={s.strings.title_password_recovery} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.SPENDING_LIMITS}
              navTransparent
              component={ifLoggedIn(SpendingLimitsConnector)}
              renderTitle={<HeaderTitle title={s.strings.spending_limits} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.EXCHANGE_SETTINGS}
              navTransparent
              component={ifLoggedIn(SwapSettingsScene)}
              renderTitle={<HeaderTitle title={s.strings.settings_exchange_settings} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.CURRENCY_SETTINGS}
              navTransparent
              component={ifLoggedIn(CurrencySettingsScene)}
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.currencyInfo} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.PROMOTION_SETTINGS}
              navTransparent
              component={ifLoggedIn(PromotionSettingsScene)}
              renderTitle={<HeaderTitle title={s.strings.title_promotion_settings} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.DEFAULT_FIAT_SETTING}
              navTransparent
              component={ifLoggedIn(DefaultFiatSettingScene)}
              renderTitle={<HeaderTitle title={s.strings.title_default_fiat} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.NOTIFICATION_SETTINGS}
              navTransparent
              component={ifLoggedIn(NotificationScene)}
              renderTitle={<HeaderTitle title={s.strings.settings_notifications} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key={Constants.CURRENCY_NOTIFICATION_SETTINGS}
              navTransparent
              component={ifLoggedIn(CurrencyNotificationScene)}
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.currencyInfo} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.PLUGIN_VIEW_DEEP} hideDrawerButton>
            <Scene
              key={Constants.PLUGIN_VIEW}
              navTransparent
              component={ifLoggedIn(GuiPluginViewScene)}
              renderTitle={props => <HeaderTitle title={props.plugin.displayName} />}
              renderLeftButton={renderPluginBackButton()}
              renderRightButton={<HeaderTextButton type="exit" />}
            />
          </Stack>

          <Stack key={Constants.TERMS_OF_SERVICE}>
            <Scene
              key={Constants.TERMS_OF_SERVICE}
              navTransparent
              component={ifLoggedIn(TermsOfServiceComponent)}
              renderTitle={<HeaderTitle title={s.strings.title_terms_of_service} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_LIST}>
            <Scene
              key={Constants.FIO_ADDRESS_LIST}
              navTransparent
              component={ifLoggedIn(FioAddressListScene)}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_REGISTER}>
            <Scene
              key={Constants.FIO_ADDRESS_REGISTER}
              navTransparent
              component={ifLoggedIn(FioAddressRegisterScene)}
              renderTitle={<HeaderTitle title={s.strings.title_fio_address_confirmation} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET}>
            <Scene
              key={Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET}
              navTransparent
              component={ifLoggedIn(FioAddressRegisterSelectWalletScene)}
              renderTitle={<HeaderTitle title={s.strings.title_fio_address_confirmation} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_DOMAIN_REGISTER}>
            <Scene
              key={Constants.FIO_DOMAIN_REGISTER}
              navTransparent
              component={ifLoggedIn(FioDomainRegisterScene)}
              renderTitle={<HeaderTitle title={s.strings.title_register_fio_domain} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key={Constants.FIO_DOMAIN_REGISTER_SELECT_WALLET}
              navTransparent
              component={ifLoggedIn(FioDomainRegisterSelectWalletScene)}
              renderTitle={<HeaderTitle title={s.strings.title_register_fio_domain} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key={Constants.FIO_DOMAIN_CONFIRM}
              navTransparent
              component={ifLoggedIn(FioNameConfirmScene)}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_NAME_CONFIRM}>
            <Scene
              key={Constants.FIO_NAME_CONFIRM}
              navTransparent
              component={ifLoggedIn(FioNameConfirmScene)}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_DETAILS}>
            <Scene
              key={Constants.FIO_ADDRESS_DETAILS}
              navTransparent
              component={ifLoggedIn(FioAddressDetailsScene)}
              renderTitle={<HeaderTitle title={s.strings.title_fio_address} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<SideMenuButton />}
            />
            <Scene
              key={Constants.FIO_CONNECT_TO_WALLETS_CONFIRM}
              navTransparent
              component={ifLoggedIn(FioConnectWalletConfirmScene)}
              renderTitle={<HeaderTitle title={s.strings.title_fio_connect_to_wallet} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_SETTINGS}>
            <Scene
              key={Constants.FIO_ADDRESS_SETTINGS}
              navTransparent
              component={FioAddressSettingsScene}
              renderTitle={<HeaderTitle title={s.strings.title_fio_address_settings} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_REGISTER_SUCCESS}>
            <Scene
              key={Constants.FIO_ADDRESS_REGISTER_SUCCESS}
              navTransparent
              component={ifLoggedIn(FioAddressRegisteredScene)}
              renderTitle={<HeaderTitle title={s.strings.title_fio_address} />}
              renderRightButton={<SideMenuButton />}
              renderLeftButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack key={Constants.FIO_DOMAIN_SETTINGS}>
            <Scene
              key={Constants.FIO_DOMAIN_SETTINGS}
              navTransparent
              component={FioDomainSettingsScene}
              renderTitle={<HeaderTitle title={s.strings.title_fio_domain_settings} />}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_REQUEST_LIST}>
            <Scene
              key={Constants.FIO_REQUEST_LIST}
              navTransparent
              component={ifLoggedIn(FioRequestListScene)}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={<SideMenuButton />}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_SENT_REQUEST_DETAILS}>
            <Scene
              key={Constants.FIO_SENT_REQUEST_DETAILS}
              navTransparent
              component={ifLoggedIn(FioSentRequestDetailsScene)}
              renderLeftButton={<BackButton withArrow onPress={this.handleBack} label={s.strings.title_back} />}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>
        </Scene>
      </Drawer>
    )
  }

  renderExchangeButton = () => {
    return <ExchangeDropMenu />
  }

  renderRequestMenuButton = () => {
    return <RequestDropMenu />
  }

  renderSendConfirmationButton = () => {
    return <SendConfirmationOptions />
  }

  renderEmptyButton = () => {
    return <BackButton withArrow={false} onPress={this.handleEmpty} />
  }

  isCurrentScene = (sceneKey: string) => {
    return Actions.currentScene === sceneKey
  }

  handleEmpty = () => null

  handleBack = () => {
    if (this.isCurrentScene(Constants.LOGIN)) {
      return false
    }
    if (this.isCurrentScene(Constants.WALLET_LIST_SCENE)) {
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
    if (this.isCurrentScene(Constants.EXCHANGE_QUOTE_SCENE)) {
      Actions.popTo(Constants.EXCHANGE_SCENE)
      return true
    }
    if (this.isCurrentScene(Constants.PLUGIN_VIEW)) {
      handlePluginBack()
      return true
    }
    if (this.isCurrentScene(Constants.FIO_ADDRESS_REGISTER)) {
      if (Actions.currentParams.noAddresses) {
        Actions.jump(Constants.WALLET_LIST_SCENE)
        return true
      }
    }
    if (this.isCurrentScene(Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET)) {
      if (Actions.currentParams.isFallback) {
        Actions.popTo(Constants.FIO_ADDRESS_REGISTER)
        return true
      }
    }
    Actions.pop()
    return true
  }
}

export const Main = connect(
  (state: RootState): StateProps => ({}),
  (dispatch: Dispatch): DispatchProps => ({
    registerDevice() {
      dispatch(registerDevice())
    },

    // Navigation actions:
    logout(username?: string): void {
      dispatch(logoutRequest(username))
    },
    openDrawer() {
      dispatch(openDrawer())
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
