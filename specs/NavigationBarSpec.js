export default function (spec) {
  spec.describe('NavigationBar', function () {
    spec.it('Menu Navigation', async function () {
      await spec.pause(10000)

      await spec.press('MenuTab.pluginListBuy')
      await spec.pause(1000)

      await spec.press('MenuTab.pluginListSell')
      await spec.pause(1000)

      await spec.press('MenuTab.exchange')
      await spec.pause(1000)

      await spec.press('MenuTab.walletList')
      await spec.pause(1000)

      await spec.press('MenuTab.walletList')
      await spec.pause(1000)

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
      await spec.pause(1000)
    })
  })
}
