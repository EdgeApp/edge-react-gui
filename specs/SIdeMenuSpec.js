import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)

  spec.describe('Side Menu', function () {
    spec.it('Navigation', async function () {
      // initializing navigation starting point
      await spec.pause(25000)
      await help.navigate('MenuTab.walletList')

      // side menu

      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'fio-names')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'fio')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'wallet-connect')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'scan-qr')
      await help.navigate('ScanModal', 'Close')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'sweep')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('WalletListModal', 'Close')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'tos')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'settings')
      await help.navigate('WalletList', 'SideMenuButton')
      await help.navigate('SideMenu', 'logout')
    })
  })
}
