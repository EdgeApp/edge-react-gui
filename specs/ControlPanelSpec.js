// Using components from Main.ui and ControlPanel
import * as helpers from './helpers.js'

export default function (spec) {
  spec.describe('ControlPanel', function () {
    spec.it('option navigation', async function () {
      await spec.pause(10000)
      // await helpers.openSideMenu('Main.WalletList')
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
      await spec.pause(3000)
      await spec.press('SideMenu.sweep')
      await spec.pause(1000)
      await spec.press('SideMenu.tos')
      await spec.pause(1000)
      await spec.press('SideMenu.share')
      // need to close the share option
      await spec.pause(1000)
      await spec.press('WalletList.SideMenuButton')
      await spec.pause(1000)
      await spec.press('SideMenu.settings')
      await spec.pause(1000)
      await spec.press('SideMenu.logout')
    })
  })
}
