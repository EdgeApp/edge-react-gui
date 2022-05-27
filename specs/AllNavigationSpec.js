import { helper } from './helper.js'

export default function (spec) {
  const help = helper(spec)

  spec.describe('AllNavigation', function () {
    spec.it('Edge App', async function () {
      await spec.pause(25000)
      // scroll through bottom navigation
      await help.snapShot('MenuTab.walletList')
      // help modal
      // await spec.press('MainUi.Help')
      // // to close navigate to diff scene
      // // await spec.press('HelpModal.KnowledgeBase')
      // // await spec.pause(500)
      // // await spec.press('HelpModal.SupportTicket')
      // // await spec.pause(500)
      // // await spec.press('HelpModal.EdgeSite')
      // // await spec.pause(500)
      // // await help.closeModal('HelpModal.CloseAssistanceModal', 'confirm')
      // // await spec.pause(500)
      // await help.snapShot('HelpModal.Close')
      // await spec.pause(1000)
      // // // Buy
      await help.snapShot('MenuTab.pluginBuy')
      await spec.pause(500)
      await help.snapShot('GuiPluginListScene.OpenCountryList')
      await spec.pause(500)

      await help.snapShot('CounrtyListModal.Close')
      await spec.pause(500)
      // // Sell
      await help.snapShot('MenuTab.pluginSell')
      await spec.pause(500)
      await help.snapShot('GuiPluginListScene.OpenCountryList')
      await spec.pause(500)
      await spec.press('CounrtyListModal.Close')
      await spec.pause(500)
      // // exchange
      // await spec.press('MenuTab.exchange')
      // await spec.pause(500)
      // await help.snapShot('CryptoExchangeScene.FromWalletList')
      // await spec.pause(500)
      // await help.snapShot('WalletListModal.Close')
      // await spec.pause(500)
      // await spec.press('CryptoExchangeScene.ToWalletList')
      // await spec.pause(500)
      // await spec.press('WalletListModal.Close')
      // await spec.pause(500)
      // await spec.press('MenuTab.walletList')
      // await spec.pause(5000)
      // // request scene
      // const rows = await help.getWalletListRows('WalletListSwipeable.WalletId')
      // await spec.press(rows[0].walletId)
      // await spec.pause(500)
      // await help.snapShot('TransactionListTop.RequestButton')
      // await spec.pause(500)
      // await spec.press('RequestScene.OpenQr')
      // await spec.pause(500)
      // await help.snapShot('QrModal.Close')
      // await spec.pause(500)
      // await spec.press('RequestScene.Back')
      // await spec.pause(500)
      // await spec.press('TransactionList.Back')
      // await spec.pause(500)
      // send scene
      // const listRows = await help.getWalletListRows('WalletListSwipeable.WalletId')
      // await spec.press(listRows[0].walletId)
      // await spec.pause(500)
      // await help.snapShot('TransactionListTop.SendButton')
      // await spec.pause(500)
      // await help.snapShot('AddressTile.SendEnterAddress')
      // await spec.pause(1000)
      // await spec.fillIn('AddressModal.EnterAddress', '0x701f312e95134ff75757250b9f6c7dc59aea03ed')

      // await spec.pause(500)
      // await spec.press('AddressModal.SubmitAddress')
      // // submit
      // await spec.pause(500)
      // // in some places the snapShot helper function fails but spec.press works
      // await spec.press('SendScene.OpenFlipInput')
      // await spec.pause(500)
      // await help.snapShot('FlipInputModal.MaxButton')
      // await spec.pause(500)

      // await spec.pause(1000)
      // await help.closeModal('FlipInputModal.Close', 'close')
      // await spec.pause(1000)
      // // in some places the snapShot helper function fails but spec.press works
      // await spec.press('SendScene.Back')

      // await spec.pause(500)
      // await spec.press('TransactionList.Back')
      // await spec.pause(500)
      // Add wallet and Add token Buttons
      // await spec.press('WalletListFooter.AddWallet')
      // await spec.pause(1000)
      // const walletRows = await help.getWalletListData('CreateWalletSelectCryptoScene.CurrencyCodeList')
      // const row = walletRows[0]
      // await spec.pause(500)
      // await help.snapShot(`CreateCryptoWalletScene.${row.walletType}Row`)
      // await spec.pause(500)
      // const fiatRows = await help.getfiatList('CreateWalletSelectFiatScene.FiatList')
      // await help.snapShot(fiatRows[0].value)
      // await spec.pause(500)
      // await spec.press('CreateWalletNameScene.NextButton')
      // await spec.pause(500)
      // await help.snapShot('CreateWalletReviewScene.Back')
      // await spec.pause(500)
      // await spec.press('CreateWalletName.Back')
      // await spec.pause(500)

      // await spec.press('CreateWalletSelectFiatScene.Back')
      // await spec.pause(500)

      // await spec.press('CreateWalletSelectCryptoScene.Back')
      // await spec.pause(500)
      // // add token
      // // await spec.press('WalletListFooter.AddToken')
      // // await spec.pause(500)
      // // how to select row for add token

      // // SideMenu
      // await help.snapShot('WalletListScene.SideMenuButton')
      // await spec.pause(1000)
      // await help.snapShot('SideMenu.fio-names')
      // await spec.pause(3000)
      // await help.snapShot('SideMenu.fio')
      // await spec.pause(3000)
      // await help.snapShot('SideMenu.wallet-connect')
      // await spec.pause(1000)
      // await help.snapShot('WcConnectionsScene.NewConnection')
      // await spec.pause(1000)
      // await spec.press('ScanModal.Close')

      // // // await spec.press('QrModal.Close')
      // await spec.pause(1000)
      // await spec.press('WcConnectionsScene.Back')
      // await spec.pause(1000)
      // await spec.press('SideMenu.scan-qr')
      // await spec.pause(1000)
      // await help.snapShot('ScanModal.Close')
      // await spec.pause(1000)
      // await spec.press('SideMenu.sweep')
      // await spec.pause(1000)
      // await help.snapShot('WalletListModal.Close')
      // await spec.pause(1000)
      // await spec.press('SideMenu.tos')
      // await spec.pause(3000)
      // await help.snapShot('TermsOfServiceScene.Back')
      // await spec.pause(1000)
      // await spec.press('WalletListScene.SideMenuButton')
      // await spec.pause(1000)

      // await help.snapShot('SideMenu.settings')

      // await spec.pause(5000)
      // await help.snapShot('SettingsScene.UnlockSettings')
      // await spec.pause(1000)
      // // add password fillin
      // // Password10
      // await spec.press('SettingsScene.OpenExchangeSettings')
      // await spec.pause(1000)

      // await help.snapShot('SwapSettingsScene.Back')
      // await spec.pause(1000)
      // // // go to scene
      // await spec.press('SettingsScene.OpenSpendingLimits')
      // await spec.pause(1000)
      // await help.snapShot('SpendingLimitsScene.Back')
      // await spec.pause(1000)
      // await spec.press('SettingsScene.OpenAutoLogout')
      // await spec.pause(1000)
      // await help.snapShot('AutoLogoutModal.Close')
      // await spec.pause(1000)
      // await spec.press('SettingsScene.OpenDefaultCurrency')
      // await spec.pause(1000)

      // await help.snapShot('DefaultFiatSettingScene.Back')
      // await spec.pause(1000)
      // await spec.press('SettingsScene.OpenNotificationSettings')
      // await spec.pause(1000)
      // // notification scene?
      // await spec.press('CurrencyNotificationScene.Back')
      // await spec.pause(1000)

      // await spec.press('SideMenu.logout')
    })
  })
}
