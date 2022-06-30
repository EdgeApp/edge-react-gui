import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)

  spec.describe('Exchange Scene', function () {
    spec.it('Navigation', async function () {
      // initializing navigation starting point
      await spec.pause(20000)
      await help.navigate('MenuTab', 'walletList')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'settings')

      // Account Settings

      await help.navigate('SettingsScene', 'UnlockAccountSettings')
      await spec.fillIn('OutlinedTextInput.AccountSettings', 'Password10')
      await spec.press('TextInputModal.AccountSettings.Submit')
      await help.navigate('SettingsScene', 'ChangePasswordSetting')
      await help.navigateBack('ChangePasswordScene')
      await help.navigate('SettingsScene', 'ChangePinSetting')
      await help.navigateBack('ChangePinScene')
      await help.navigate('SettingsScene', 'SetUpTwoFactor')
      await help.navigateBack('TwoFactorSettingsScene')
      await help.navigate('SettingsScene', 'SetUpPasswordRecovery')
      await help.navigateBack('ChangePasswordRecoveryScene')

      // Settings

      await help.navigate('SettingsScene', 'OpenExchangeSettings')
      await help.navigateBack('SwapSettingsScene')
      await help.navigate('SettingsScene', 'OpenSpendingLimits')
      await help.navigateBack('SpendingLimitsScene')
      await help.navigate('SettingsScene', 'OpenAutoLogout')
      await help.closeModal('AutoLogoutModal')
      await help.navigate('SettingsScene', 'OpenDefaultCurrency')
      await help.navigateBack('DefaultFiatSettingScene')

      // currency notifications

      await help.navigate('SettingsScene', 'CurrencySettings.bitcoin')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.bitcoincash')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.ethereum')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.ethereumclassic')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.dash')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.litecoin')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.bitcoinsv')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.zcoin')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.digibyte')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.dogecoin')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.qtum')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.vertcoin')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.feathercoin')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.ravencoin')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.bitcoingold')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.smartcash')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.groestlcoin')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.eboost')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'CurrencySettings.ufo')
      await help.navigateBack('CurrencySettingsScene')
      await help.navigate('SettingsScene', 'OpenRestoreWalletsModal')
      await help.navigate('SettingsActionsRestoreWalletsModal', 'cancel')
      await help.navigate('SettingsScene', 'OpenNotificationSettings')
      await help.navigateBack('NotificationScene')
    })
  })
}
