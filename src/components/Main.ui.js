// @flow

import * as React from 'react'
import { Image, StyleSheet, TouchableWithoutFeedback, View, YellowBox } from 'react-native'
import { Actions, Drawer, Router, Scene, Stack, Tabs } from 'react-native-router-flux'
import { connect } from 'react-redux'

import ENV from '../../env.json'
import { checkEnabledExchanges } from '../actions/CryptoExchangeActions.js'
import { checkAndShowGetCryptoModal } from '../actions/ScanActions.js'
import { openDrawer } from '../actions/ScenesActions.js'
import { showReEnableOtpModal } from '../actions/SettingsActions.js'
import MenuIcon from '../assets/images/MenuButton/menu.png'
import buyIconSelected from '../assets/images/tabbar/buy_selected.png'
import buyIcon from '../assets/images/tabbar/buy.png'
import exchangeIconSelected from '../assets/images/tabbar/exchange_selected.png'
import exchangeIcon from '../assets/images/tabbar/exchange.png'
import sellIconSelected from '../assets/images/tabbar/sell_selected.png'
import sellIcon from '../assets/images/tabbar/sell.png'
import walletIconSelected from '../assets/images/tabbar/wallets_selected.png'
import walletIcon from '../assets/images/tabbar/wallets.png'
import { HeaderWalletSelector } from '../components/common/HeaderWalletSelector.js'
import { CreateWalletChoiceComponent } from '../components/scenes/CreateWalletChoiceScene.js'
import { CreateWalletImportScene } from '../components/scenes/CreateWalletImportScene.js'
import { CreateWalletReviewScene } from '../components/scenes/CreateWalletReviewScene.js'
import { CreateWalletSelectCryptoScene } from '../components/scenes/CreateWalletSelectCryptoScene.js'
import { CreateWalletSelectFiatScene } from '../components/scenes/CreateWalletSelectFiatScene.js'
import { CryptoExchangeScene } from '../components/scenes/CryptoExchangeScene.js'
import { CurrencySettingsScene } from '../components/scenes/CurrencySettingsScene.js'
import { DefaultFiatSettingScene } from '../components/scenes/DefaultFiatSettingScene.js'
import { FioAddressRegisteredScene } from '../components/scenes/FioAddressRegisteredScene'
import { FioAddressSettingsScene } from '../components/scenes/FioAddressSettingsScene'
import { FioDomainSettingsScene } from '../components/scenes/FioDomainSettingsScene'
import { FioRequestConfirmationScene } from '../components/scenes/FioRequestConfirmationScene.js'
import { PromotionSettingsScene } from '../components/scenes/PromotionSettingsScene.js'
import { SendScene } from '../components/scenes/SendScene'
import { SwapSettingsScene } from '../components/scenes/SwapSettingsScene.js'
import { TransactionsExportScene } from '../components/scenes/TransactionsExportScene.js'
import { WalletListScene } from '../components/scenes/WalletListScene.js'
import { requestPermission } from '../components/services/PermissionsManager.js'
import ExchangeDropMenu from '../connectors/components/HeaderMenuExchangeConnector'
import RequestDropMenu from '../connectors/components/HeaderMenuRequestConnector'
import AddToken from '../connectors/scenes/AddTokenConnector.js'
import ChangePasswordConnector from '../connectors/scenes/ChangePasswordConnector.ui'
import ChangePinConnector from '../connectors/scenes/ChangePinConnector.ui'
import { CreateWalletAccountSelectConnector } from '../connectors/scenes/CreateWalletAccountSelectConnector.js'
import { CreateWalletAccountSetupConnector } from '../connectors/scenes/CreateWalletAccountSetupConnector.js'
import { CryptoExchangeQuoteConnector } from '../connectors/scenes/CryptoExchangeQuoteConnector.js'
import EdgeLoginSceneConnector from '../connectors/scenes/EdgeLoginSceneConnector'
import { FioAddressDetailsConnector } from '../connectors/scenes/FioAddressDetailsConnector'
import { FioAddressListConnector } from '../connectors/scenes/FioAddressListConnector'
import { FioAddressRegisterConnector } from '../connectors/scenes/FioAddressRegisterConnector'
import { FioAddressRegisterSelectWalletConnector } from '../connectors/scenes/FioAddressRegisterSelectWalletConnector'
import { FioConnectWalletConfirmConnector } from '../connectors/scenes/FioConnectWalletConfirmConnector'
import { FioRequestListConnector } from '../connectors/scenes/FioRequestListConnector'
import { FioSentRequestConnector } from '../connectors/scenes/FioSentRequestConnector'
import ManageTokens from '../connectors/scenes/ManageTokensConnector.js'
import PasswordRecoveryConnector from '../connectors/scenes/PasswordRecoveryConnector.js'
import Request from '../connectors/scenes/RequestConnector.js'
import Scan from '../connectors/scenes/ScanConnector'
import SendConfirmation from '../connectors/scenes/SendConfirmationConnector.js'
import TransactionListConnector from '../connectors/scenes/TransactionListConnector'
import SendConfirmationOptions from '../connectors/SendConfirmationOptionsConnector.js'
import SpendingLimitsConnector from '../connectors/SpendingLimitsConnector.js'
import * as Constants from '../constants/indexConstants'
import s from '../locales/strings.js'
import { registerDevice } from '../modules/Device/action'
import { logoutRequest } from '../modules/Login/action.js'
import ControlPanel from '../modules/UI/components/ControlPanel/ControlPanelConnector'
import T from '../modules/UI/components/FormattedText/FormattedText.ui.js'
import BackButton from '../modules/UI/components/Header/Component/BackButton.ui'
import { ExitButton } from '../modules/UI/components/Header/Component/ExitButton.js'
import HelpButton from '../modules/UI/components/Header/Component/HelpButton.ui.js'
import WalletName from '../modules/UI/components/Header/WalletName/WalletNameConnector.js'
import { ifLoggedIn } from '../modules/UI/components/LoginStatus/LoginStatus.js'
import { PasswordRecoveryReminderModalConnector } from '../modules/UI/components/PasswordRecoveryReminderModal/PasswordRecoveryReminderModalConnector.js'
import { passwordReminderModalConnector as PasswordReminderModal } from '../modules/UI/components/PasswordReminderModal/indexPasswordReminderModal.js'
import { type Permission } from '../reducers/PermissionsReducer.js'
import { THEME } from '../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../types/reduxTypes.js'
import { scale } from '../util/scaling.js'
import { logEvent } from '../util/tracking.js'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle.js'
import { handlePluginBack, renderPluginBackButton } from './navigation/GuiPluginBackButton.js'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle.js'
import { ChangeMiningFeeScene } from './scenes/ChangeMiningFeeScene.js'
import { CreateWalletName } from './scenes/CreateWalletNameScene.js'
import { CryptoExchangeQuoteProcessingScreenComponent } from './scenes/CryptoExchangeQuoteProcessingScene.js'
import { CurrencyNotificationScene } from './scenes/CurrencyNotificationScene'
import { EditTokenScene } from './scenes/EditTokenScene.js'
import { FioDomainRegisterScene } from './scenes/FioDomainRegisterScene'
import { FioDomainRegisterSelectWalletScene } from './scenes/FioDomainRegisterSelectWalletScene'
import { FioNameConfirmScene } from './scenes/FioNameConfirmScene'
import { GuiPluginLegacyScene, renderLegacyPluginBackButton } from './scenes/GuiPluginLegacyScene.js'
import { GuiPluginListScene } from './scenes/GuiPluginListScene.js'
import { GuiPluginViewScene } from './scenes/GuiPluginViewScene.js'
import { LoginScene } from './scenes/LoginScene.js'
import { NotificationScene } from './scenes/NotificationScene'
import { OtpSettingsScene } from './scenes/OtpSettingsScene.js'
import { SettingsScene } from './scenes/SettingsScene.js'
import { TermsOfServiceComponent } from './scenes/TermsOfServiceScene.js'
import { TransactionDetailsScene } from './scenes/TransactionDetailsScene.js'
import { showToast } from './services/AirshipInstance.js'

const RouterWithRedux = connect()(Router)

const tabBarIconFiles: { [tabName: string]: string } = {}
tabBarIconFiles[Constants.WALLET_LIST] = walletIcon
tabBarIconFiles[Constants.PLUGIN_BUY] = buyIcon
tabBarIconFiles[Constants.PLUGIN_SELL] = sellIcon
tabBarIconFiles[Constants.TRANSACTION_LIST] = exchangeIcon
tabBarIconFiles[Constants.EXCHANGE] = exchangeIcon

const tabBarIconFilesSelected: { [tabName: string]: string } = {}
tabBarIconFilesSelected[Constants.WALLET_LIST] = walletIconSelected
tabBarIconFilesSelected[Constants.PLUGIN_BUY] = buyIconSelected
tabBarIconFilesSelected[Constants.PLUGIN_SELL] = sellIconSelected
tabBarIconFilesSelected[Constants.TRANSACTION_LIST] = exchangeIconSelected
tabBarIconFilesSelected[Constants.EXCHANGE] = exchangeIconSelected

type DispatchProps = {
  registerDevice(): void,

  // Navigation actions:
  logout(username?: string): void,
  openDrawer(): void,

  // Things to do when we enter certain scenes:
  checkAndShowGetCryptoModal(routeData: string | void): void,
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
              renderTitle={this.renderTitle(s.strings.title_edge_login)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderHelpButton()}
            />
            {this.renderTransactionDetailsView()}
            {this.renderTabView()}
          </Stack>
        </RouterWithRedux>
        <PasswordReminderModal />
        <PasswordRecoveryReminderModalConnector />
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
        renderTitle={TransactionDetailsTitle}
        renderLeftButton={this.renderBackButton()}
        renderRightButton={this.renderMenuButton()}
      />
    )
  }

  renderTabView = () => {
    return (
      <Drawer key={Constants.EDGE} hideNavBar contentComponent={ControlPanel} hideDrawerButton drawerPosition="right" drawerWidth={scale(280)}>
        {/* Wrapper Scene needed to fix a bug where the tabs would reload as a modal ontop of itself */}
        <Scene key="AllMyTabs" hideNavBar>
          <Tabs key={Constants.EDGE} swipeEnabled={false} navTransparent tabBarPosition="bottom" showLabel tabBarStyle={styles.footerTabStyles}>
            <Stack key={Constants.WALLET_LIST} icon={this.icon(Constants.WALLET_LIST)} tabBarLabel={s.strings.title_wallets}>
              <Scene
                key={Constants.WALLET_LIST_SCENE}
                navTransparent
                component={ifLoggedIn(WalletListScene)}
                renderTitle={this.renderTitle(s.strings.title_wallets)}
                renderLeftButton={this.renderHelpButton()}
                renderRightButton={this.renderMenuButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_CHOICE}
                navTransparent
                component={ifLoggedIn(CreateWalletChoiceComponent)}
                renderTitle={this.renderTitle(s.strings.title_create_wallet)}
                renderLeftButton={this.renderBackButton(s.strings.title_wallets)}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_IMPORT}
                navTransparent
                component={ifLoggedIn(CreateWalletImportScene)}
                renderTitle={this.renderTitle(s.strings.create_wallet_import_title)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_SELECT_CRYPTO}
                navTransparent
                component={ifLoggedIn(CreateWalletSelectCryptoScene)}
                renderTitle={this.renderTitle(s.strings.title_create_wallet_select_crypto)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_NAME}
                navTransparent
                component={ifLoggedIn(CreateWalletName)}
                renderTitle={this.renderTitle(s.strings.title_create_wallet)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_SELECT_FIAT}
                navTransparent
                component={ifLoggedIn(CreateWalletSelectFiatScene)}
                renderTitle={this.renderTitle(s.strings.title_create_wallet_select_fiat)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_REVIEW}
                navTransparent
                component={ifLoggedIn(CreateWalletReviewScene)}
                renderTitle={this.renderTitle(s.strings.title_create_wallet)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderEmptyButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_ACCOUNT_SETUP}
                navTransparent
                component={ifLoggedIn(CreateWalletAccountSetupConnector)}
                renderTitle={this.renderTitle(s.strings.create_wallet_create_account)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderHelpButton()}
              />

              <Scene
                key={Constants.CREATE_WALLET_ACCOUNT_SELECT}
                navTransparent
                component={ifLoggedIn(CreateWalletAccountSelectConnector)}
                renderTitle={this.renderTitle(s.strings.create_wallet_account_activate)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderHelpButton()}
              />

              <Scene
                key={Constants.TRANSACTION_LIST}
                onEnter={() => {
                  this.props.requestPermission('contacts')
                }}
                navTransparent
                component={ifLoggedIn(TransactionListConnector)}
                renderTitle={this.renderHeaderWalletSelector()}
                renderLeftButton={this.renderBackButton(s.strings.title_wallets)}
                renderRightButton={this.renderMenuButton()}
              />

              <Scene
                key={Constants.SCAN}
                navTransparent
                onEnter={props => {
                  this.props.requestPermission('camera')
                  this.props.dispatchEnableScan()
                  this.props.checkAndShowGetCryptoModal(props.data)
                }}
                onExit={this.props.dispatchDisableScan}
                component={ifLoggedIn(Scan)}
                renderTitle={this.renderHeaderWalletSelector()}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderMenuButton()}
              />

              <Scene
                key={Constants.REQUEST}
                navTransparent
                component={ifLoggedIn(Request)}
                renderTitle={this.renderHeaderWalletSelector()}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderRequestMenuButton()}
                hideTabBar
              />

              <Scene
                key={Constants.FIO_REQUEST_CONFIRMATION}
                navTransparent
                component={ifLoggedIn(FioRequestConfirmationScene)}
                renderTitle={this.renderTitle(s.strings.fio_confirm_request_header)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderMenuButton()}
              />

              <Scene
                key={Constants.MANAGE_TOKENS}
                renderLeftButton={this.renderBackButton()}
                navTransparent
                component={ifLoggedIn(ManageTokens)}
                renderTitle={this.renderTitle(s.strings.title_manage_tokens)}
                renderRightButton={this.renderEmptyButton()}
                animation="fade"
                duration={600}
              />
              <Scene
                key={Constants.ADD_TOKEN}
                component={ifLoggedIn(AddToken)}
                navTransparent
                onLeft={Actions.pop}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderEmptyButton()}
                renderTitle={this.renderTitle(s.strings.title_add_token)}
              />
              <Scene
                key={Constants.EDIT_TOKEN}
                component={ifLoggedIn(EditTokenScene)}
                navTransparent
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderEmptyButton()}
                renderTitle={this.renderTitle(s.strings.title_edit_token)}
              />
              <Scene
                key={Constants.TRANSACTIONS_EXPORT}
                navTransparent
                component={ifLoggedIn(TransactionsExportScene)}
                renderTitle={this.renderTitle(s.strings.title_export_transactions)}
                renderLeftButton={this.renderBackButton(s.strings.title_wallets)}
                renderRightButton={this.renderEmptyButton()}
              />
            </Stack>

            <Stack key={Constants.PLUGIN_BUY} icon={this.icon(Constants.PLUGIN_BUY)} tabBarLabel={s.strings.title_buy}>
              <Scene
                key={Constants.PLUGIN_BUY}
                navTransparent
                component={ifLoggedIn(GuiPluginListScene)}
                renderTitle={this.renderTitle(s.strings.title_plugin_buy)}
                renderLeftButton={this.renderHelpButton()}
                renderRightButton={this.renderMenuButton()}
                onLeft={Actions.pop}
                direction="buy"
              />
              <Scene
                key={Constants.PLUGIN_VIEW}
                navTransparent
                component={ifLoggedIn(GuiPluginViewScene)}
                renderTitle={props => this.renderTitle(props.plugin.displayName)}
                renderLeftButton={renderPluginBackButton()}
                renderRightButton={this.renderExitButton()}
                hideTabBar
              />
              <Scene
                key={Constants.PLUGIN_VIEW_LEGACY}
                navTransparent
                component={ifLoggedIn(GuiPluginLegacyScene)}
                renderTitle={props => this.renderTitle(props.plugin.displayName)}
                renderLeftButton={renderLegacyPluginBackButton()}
                renderRightButton={this.renderExitButton()}
                hideTabBar
              />
            </Stack>

            <Stack key={Constants.PLUGIN_SELL} icon={this.icon(Constants.PLUGIN_SELL)} tabBarLabel={s.strings.title_sell}>
              <Scene
                key={Constants.PLUGIN_SELL}
                navTransparent
                component={ifLoggedIn(GuiPluginListScene)}
                renderTitle={this.renderTitle(s.strings.title_plugin_sell)}
                renderLeftButton={this.renderHelpButton()}
                renderRightButton={this.renderMenuButton()}
                onLeft={Actions.pop}
                direction="sell"
              />
              <Scene
                key={Constants.PLUGIN_VIEW}
                navTransparent
                component={ifLoggedIn(GuiPluginViewScene)}
                renderTitle={props => this.renderTitle(props.plugin.displayName)}
                renderLeftButton={renderPluginBackButton()}
                renderRightButton={this.renderExitButton()}
                hideTabBar
              />
              <Scene
                key={Constants.PLUGIN_VIEW_LEGACY}
                navTransparent
                component={ifLoggedIn(GuiPluginLegacyScene)}
                renderTitle={props => this.renderTitle(props.plugin.displayName)}
                renderLeftButton={renderLegacyPluginBackButton()}
                renderRightButton={this.renderExitButton()}
                hideTabBar
              />
            </Stack>

            <Stack key={Constants.EXCHANGE} icon={this.icon(Constants.EXCHANGE)} tabBarLabel={s.strings.title_exchange}>
              <Scene
                key={Constants.EXCHANGE_SCENE}
                navTransparent
                component={ifLoggedIn(CryptoExchangeScene)}
                renderTitle={this.renderTitle(s.strings.title_exchange)}
                renderLeftButton={this.renderExchangeButton()}
                renderRightButton={this.renderMenuButton()}
                onEnter={() => this.props.checkEnabledExchanges()}
              />
              <Scene
                key={Constants.EXCHANGE_QUOTE_PROCESSING_SCENE}
                navTransparent
                hideTabBar
                component={ifLoggedIn(CryptoExchangeQuoteProcessingScreenComponent)}
                renderTitle={this.renderTitle(s.strings.title_exchange)}
                renderLeftButton={this.renderEmptyButton()}
                renderRightButton={this.renderEmptyButton()}
              />
              <Scene
                key={Constants.EXCHANGE_QUOTE_SCENE}
                navTransparent
                component={ifLoggedIn(CryptoExchangeQuoteConnector)}
                renderTitle={this.renderTitle(s.strings.title_exchange)}
                renderLeftButton={this.renderBackButton()}
                renderRightButton={this.renderMenuButton()}
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
              renderTitle={this.renderWalletName()}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderSendConfirmationButton()}
            />
            <Scene
              key={Constants.CHANGE_MINING_FEE_SEND_CONFIRMATION}
              navTransparent
              component={ifLoggedIn(ChangeMiningFeeScene)}
              renderTitle={this.renderTitle(s.strings.title_change_mining_fee)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderHelpButton()}
            />
          </Stack>

          <Stack key={Constants.SEND} hideTabBar>
            <Scene
              key={Constants.SEND}
              navTransparent
              hideTabBar
              panHandlers={null}
              component={ifLoggedIn(SendScene)}
              renderTitle={this.renderTitle(s.strings.title_send)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderHelpButton()}
            />
          </Stack>

          <Stack key={Constants.MANAGE_TOKENS} hideTabBar>
            <Scene
              key={Constants.MANAGE_TOKENS_NOT_USED}
              navTransparent
              component={ifLoggedIn(ManageTokens)}
              renderTitle={this.renderTitle(s.strings.title_manage_tokens)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />

            <Scene
              key={Constants.ADD_TOKEN}
              navTransparent
              component={ifLoggedIn(AddToken)}
              renderTitle={this.renderTitle(s.strings.title_add_token)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
          </Stack>

          <Stack key={Constants.PLUGIN_EARN_INTEREST}>
            <Scene
              key={Constants.PLUGIN_EARN_INTEREST}
              navTransparent
              component={ifLoggedIn(GuiPluginViewScene)}
              renderTitle={props => this.renderTitle(props.plugin.displayName)}
              renderLeftButton={renderPluginBackButton()}
              renderRightButton={this.renderExitButton()}
              hideTabBar
            />
          </Stack>

          <Stack key={Constants.SETTINGS_OVERVIEW_TAB} hideDrawerButton>
            <Scene
              key={Constants.SETTINGS_OVERVIEW}
              navTransparent
              onEnter={() => this.props.showReEnableOtpModal()}
              component={ifLoggedIn(SettingsScene)}
              renderTitle={this.renderTitle(s.strings.title_settings)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.CHANGE_PASSWORD}
              navTransparent
              component={ifLoggedIn(ChangePasswordConnector)}
              renderTitle={this.renderTitle(s.strings.title_change_password)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.CHANGE_PIN}
              navTransparent
              component={ifLoggedIn(ChangePinConnector)}
              renderTitle={this.renderTitle(s.strings.title_change_pin)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.OTP_SETUP}
              navTransparent
              component={ifLoggedIn(OtpSettingsScene)}
              renderTitle={this.renderTitle(s.strings.title_otp)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.RECOVER_PASSWORD}
              navTransparent
              component={ifLoggedIn(PasswordRecoveryConnector)}
              renderTitle={this.renderTitle(s.strings.title_password_recovery)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.SPENDING_LIMITS}
              navTransparent
              component={ifLoggedIn(SpendingLimitsConnector)}
              renderTitle={this.renderTitle(s.strings.spending_limits)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.EXCHANGE_SETTINGS}
              navTransparent
              component={ifLoggedIn(SwapSettingsScene)}
              renderTitle={this.renderTitle(s.strings.settings_exchange_settings)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.CURRENCY_SETTINGS}
              navTransparent
              component={ifLoggedIn(CurrencySettingsScene)}
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.currencyInfo} />}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.PROMOTION_SETTINGS}
              navTransparent
              component={ifLoggedIn(PromotionSettingsScene)}
              renderTitle={this.renderTitle(s.strings.title_promotion_settings)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.DEFAULT_FIAT_SETTING}
              navTransparent
              component={ifLoggedIn(DefaultFiatSettingScene)}
              renderTitle={this.renderTitle(s.strings.title_default_fiat)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
            />
            <Scene
              key={Constants.NOTIFICATION_SETTINGS}
              navTransparent
              component={ifLoggedIn(NotificationScene)}
              renderTitle={this.renderTitle(s.strings.settings_notifications)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key={Constants.CURRENCY_NOTIFICATION_SETTINGS}
              navTransparent
              component={ifLoggedIn(CurrencyNotificationScene)}
              renderTitle={props => <CurrencySettingsTitle currencyInfo={props.currencyInfo} />}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.PLUGIN_VIEW_DEEP} hideDrawerButton>
            <Scene
              key={Constants.PLUGIN_VIEW}
              navTransparent
              component={ifLoggedIn(GuiPluginViewScene)}
              renderTitle={props => this.renderTitle(props.plugin.displayName)}
              renderLeftButton={renderPluginBackButton()}
              renderRightButton={this.renderExitButton()}
            />
          </Stack>

          <Stack key={Constants.TERMS_OF_SERVICE}>
            <Scene
              key={Constants.TERMS_OF_SERVICE}
              navTransparent
              component={ifLoggedIn(TermsOfServiceComponent)}
              renderTitle={this.renderTitle(s.strings.title_terms_of_service)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_LIST}>
            <Scene
              key={Constants.FIO_ADDRESS_LIST}
              navTransparent
              component={ifLoggedIn(FioAddressListConnector)}
              renderTitle={this.renderTitle(s.strings.title_fio_names)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderMenuButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_REGISTER}>
            <Scene
              key={Constants.FIO_ADDRESS_REGISTER}
              navTransparent
              component={ifLoggedIn(FioAddressRegisterConnector)}
              renderTitle={this.renderTitle(s.strings.title_fio_address_confirmation)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderMenuButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET}>
            <Scene
              key={Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET}
              navTransparent
              component={ifLoggedIn(FioAddressRegisterSelectWalletConnector)}
              renderTitle={this.renderTitle(s.strings.title_fio_address_confirmation)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_DOMAIN_REGISTER}>
            <Scene
              key={Constants.FIO_DOMAIN_REGISTER}
              navTransparent
              component={ifLoggedIn(FioDomainRegisterScene)}
              renderTitle={this.renderTitle(s.strings.title_register_fio_domain)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key={Constants.FIO_DOMAIN_REGISTER_SELECT_WALLET}
              navTransparent
              component={ifLoggedIn(FioDomainRegisterSelectWalletScene)}
              renderTitle={this.renderTitle(s.strings.title_register_fio_domain)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
            <Scene
              key={Constants.FIO_DOMAIN_CONFIRM}
              navTransparent
              component={ifLoggedIn(FioNameConfirmScene)}
              renderTitle={this.renderTitle(s.strings.title_register_fio_domain)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_NAME_CONFIRM}>
            <Scene
              key={Constants.FIO_NAME_CONFIRM}
              navTransparent
              component={ifLoggedIn(FioNameConfirmScene)}
              renderTitle={this.renderTitle(s.strings.title_fio_address_confirmation)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_DETAILS}>
            <Scene
              key={Constants.FIO_ADDRESS_DETAILS}
              navTransparent
              component={ifLoggedIn(FioAddressDetailsConnector)}
              renderTitle={this.renderTitle(s.strings.title_fio_address)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderMenuButton()}
            />
            <Scene
              key={Constants.FIO_CONNECT_TO_WALLETS_CONFIRM}
              navTransparent
              component={ifLoggedIn(FioConnectWalletConfirmConnector)}
              renderTitle={this.renderTitle(s.strings.title_fio_connect_to_wallet)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderMenuButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_SETTINGS}>
            <Scene
              key={Constants.FIO_ADDRESS_SETTINGS}
              navTransparent
              component={FioAddressSettingsScene}
              renderTitle={this.renderTitle(s.strings.title_fio_address_settings)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderMenuButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_ADDRESS_REGISTER_SUCCESS}>
            <Scene
              key={Constants.FIO_ADDRESS_REGISTER_SUCCESS}
              navTransparent
              component={ifLoggedIn(FioAddressRegisteredScene)}
              renderTitle={this.renderTitle(s.strings.title_fio_address)}
              renderRightButton={this.renderMenuButton()}
            />
          </Stack>

          <Stack key={Constants.FIO_DOMAIN_SETTINGS}>
            <Scene
              key={Constants.FIO_DOMAIN_SETTINGS}
              navTransparent
              component={FioDomainSettingsScene}
              renderTitle={this.renderTitle(s.strings.title_fio_domain_settings)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderMenuButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_REQUEST_LIST}>
            <Scene
              key={Constants.FIO_REQUEST_LIST}
              navTransparent
              component={ifLoggedIn(FioRequestListConnector)}
              renderTitle={this.renderTitle(s.strings.drawer_fio_requests)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderMenuButton()}
              onLeft={Actions.pop}
            />
          </Stack>

          <Stack key={Constants.FIO_SENT_REQUEST_DETAILS}>
            <Scene
              key={Constants.FIO_SENT_REQUEST_DETAILS}
              navTransparent
              component={ifLoggedIn(FioSentRequestConnector)}
              renderTitle={this.renderTitle(s.strings.title_fio_sent_request_details)}
              renderLeftButton={this.renderBackButton()}
              renderRightButton={this.renderEmptyButton()}
              onLeft={Actions.pop}
            />
          </Stack>
        </Scene>
      </Drawer>
    )
  }

  renderHeaderWalletSelector = () => {
    return <HeaderWalletSelector />
  }

  renderWalletName = () => {
    return (
      <View style={styles.titleWrapper}>
        <WalletName />
      </View>
    )
  }

  renderExitButton = () => {
    return <ExitButton />
  }

  renderEmptyButton = () => {
    return <BackButton />
  }

  renderHelpButton = () => {
    return <HelpButton />
  }

  renderBackButton = (label: string = s.strings.title_back) => {
    return <BackButton withArrow onPress={this.handleBack} label={label} />
  }

  renderTitle = (title: string) => {
    return (
      <View style={styles.titleWrapper}>
        <T style={styles.titleStyle}>{title}</T>
      </View>
    )
  }

  renderSpendTitle = (title: string) => {
    return (
      <View style={styles.titleWrapper}>
        <T style={styles.titleStyle}>title</T>
      </View>
    )
  }

  renderMenuButton = () => {
    return (
      <TouchableWithoutFeedback onPress={this.props.openDrawer}>
        <Image source={MenuIcon} />
      </TouchableWithoutFeedback>
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

  icon = (tabName: string) => (props: { focused: boolean }) => {
    if (typeof tabBarIconFiles[tabName] === 'undefined' || typeof tabBarIconFilesSelected[tabName] === 'undefined') {
      throw new Error('Invalid tabbar name')
    }
    let imageFile
    if (props.focused) {
      imageFile = tabBarIconFilesSelected[tabName]
    } else {
      imageFile = tabBarIconFiles[tabName]
    }
    return <Image source={imageFile} />
  }

  isCurrentScene = (sceneKey: string) => {
    return Actions.currentScene === sceneKey
  }

  handleBack = () => {
    if (this.isCurrentScene(Constants.LOGIN)) {
      return false
    }
    if (this.isCurrentScene(Constants.WALLET_LIST_SCENE)) {
      if (this.backPressedOnce) {
        this.props.logout()
      } else {
        this.backPressedOnce = true
        showToast(s.strings.back_button_tap_again_to_exit).then(() => {
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

const rawStyles = {
  titleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  },
  footerTabStyles: {
    height: THEME.FOOTER_TABS_HEIGHT
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

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
    checkAndShowGetCryptoModal(routeData: string | void): void {
      if (routeData === 'sweepPrivateKey') return
      dispatch(checkAndShowGetCryptoModal())
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
