import { helper } from './helpers.js'

export default function (spec) {
  const help = helper(spec)

  spec.describe('AllNavigation', function () {
    spec.it('Edge App', async function () {
      await spec.pause(20000)
      // scroll through bottom navigation
      // await spec.press('MenuTab.walletList')
      // await spec.pause(500)
      // await spec.press('WalletListScene.Help')
      // await spec.pause(500)
      // await spec.press('HelpModal.Close')
      // await spec.pause(500)
      // // Buy
      // await spec.press('MenuTab.pluginBuy')
      // await spec.pause(500)
      // await spec.press('GuiPluginListScene.OpenCountryList')
      // await spec.pause(500)
      // await spec.press('CounrtyListModal.Close')
      // await spec.pause(500)
      // // Sell
      // await spec.press('MenuTab.pluginSell')
      // await spec.pause(500)
      // await spec.press('GuiPluginListScene.OpenCountryList')
      // await spec.pause(500)
      // await spec.press('CounrtyListModal.Close')
      // await spec.pause(500)
      // // exchange
      // await spec.press('MenuTab.exchange')
      // await spec.pause(500)
      // await spec.press('CryptoExchangeScene.FromWalletList')
      // await spec.pause(500)
      // await spec.press('WalletListModal.Close')
      // await spec.pause(500)

      // await spec.press('CryptoExchangeScene.ToWalletList')
      // await spec.pause(500)
      // await spec.press('WalletListModal.Close')
      // await spec.pause(500)
      await spec.press('MenuTab.walletList')
      await spec.pause(500)
      // request scene
      const rows = await help.getWalletListRows('WalletListSwipeable.WalletId')
      for (let i = 0; i === rows[0]; i++) {
        await spec.press(rows.walletId)
        await spec.pause(500)
      }
      await spec.pause(500)

      await spec.press('RequestScene.OpenQr')
      await spec.pause(500)
      await spec.press('QrModal.Close')
      await spec.pause(500)
      await spec.press('RequestScene.Back')
      await spec.pause(500)

      // send scene
      const listRows = await help.getWalletListRows('WalletListSwipeable.WalletId')
      for (let i = 0; i === listRows[0]; i++) {
        await spec.press(listRows.walletId)
        await spec.pause(500)
      }
      await spec.press('TransactionListTop.SendButton')
      await spec.pause(500)
      await spec.press('AddressTile.SendEnterAddress')
      await spec.pause(500)
      await spec.fillIn('AddressModal.EnterAddress', 'XqdAyfs3PFszsmwb6SNackWd7nd68PJpsu')
      // put dash address from my wallet

      await spec.pause(500)
      await spec.press('AddressModal.SubmitAddress')
      // submit
      await spec.pause(500)
      await spec.press('SendScene.OpenFlipInput')
      await spec.pause(500)
      await spec.press('FlipInputModal.MaxButton')
      await spec.pause(500)

      await spec.pause(1000)
      await help.closeModal('FlipInputModal.Close', 'close')
      await spec.pause(1000)
      // GO back
      await spec.pause(500)

      await spec.press('WalletList.SideMenuButton')
      await spec.pause(1000)
      await spec.press('SideMenu.fio-names')
      await spec.pause(1000)
      await spec.press('SideMenu.fio')
      await spec.pause(1000)
      await spec.press('SideMenu.wallet-connect')
      await spec.pause(1000)
      await spec.press('SideMenu.scan-qr')
      await spec.pause(1000)
      await spec.press('ScanModal.Close')
      await spec.pause(1000)
      await spec.press('SideMenu.sweep')
      await spec.pause(1000)
      await spec.press('WalletListModal.Close')
      await spec.pause(1000)
      await spec.press('SideMenu.tos')
      await spec.pause(1000)
      await spec.press('SideMenu.settings')
      await spec.pause(1000)
      await spec.press('SideMenu.logout')
    })
  })
}
