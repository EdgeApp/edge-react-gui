import * as helpers from './helpers.js'
// I am using components from Main.ui and ControlPanel
export default function (spec) {
  spec.describe('ControlPanel', function () {
    spec.it('option navigation', async function () {
      await spec.pause(500000)
      // does switch account need to be added?
      // await helpers.openSideMenu('Main.WalletList') // doesn't this still need to press the renderRightButton?
      const walletListScene = await spec.findComponent('Main.WalletList')
      await spec.press(walletListScene.props.renderRightButton)
      await spec.pause(200)
      await spec.press('SideMenu.fio-names')
      await spec.pause(500)
      const FioAddressListScene = await spec.findComponent('Main.FioNames')
      await spec.press(FioAddressListScene.props.renderRightButton)
      await spec.pause(500)
      await spec.press('SideMenu.fio')
      await spec.pause(500)
      const FioRequestListScene = await spec.findComponent('Main.FioRequestList')
      await spec.press(FioRequestListScene.props.renderRightButton)
      await spec.pause(500)
      await spec.press('SideMenu.wallet-connect')
      await spec.pause(500)
      const WcConnectionsScene = await spec.findComponent('Main.WcConnections')
      await spec.press(WcConnectionsScene.props.renderRightButton)
      await spec.pause(500)
      await spec.press('SideMenu.scan-qr')
      await spec.pause(500)
      const scanModal = await spec.findComponent('SideMenu.ScanModal')
      const uri = await helpers.resolveModal(scanModal, 'Login-token name') // the resolveModal helper closes the modal
      await spec.pause(500)
      console.log(uri)
      // when this closes does it revert to mainWalletlist or stay on controlPanel?
      await spec.press('SideMenu.sweep')
      await spec.pause(500)
      const SweepPrivateKeyModal = await spec.findComponent('SideMenu.SweepScanModal')
      const ScannedPrivateKey = await helpers.resolveModal(SweepPrivateKeyModal, 'Private-key-from-QR')
      await spec.pause(500)
      console.log(ScannedPrivateKey)
      await spec.press('SideMenu.tos')
      await spec.pause(500)
      const TermsOfServiceComponent = await spec.findComponent('Main.TermsOfService')
      await spec.press(TermsOfServiceComponent.props.renderRightButton)
      await spec.pause(500)
      await spec.press('SideMenu.share')
      await spec.pause(500)
      // is share able to be wrapped?

      await spec.pause(500)
      await spec.press('SideMenu.settings')
      await spec.pause(500)
      const SettingsScene = await spec.findComponent('Main.SettingsOverview')
      await spec.press(SettingsScene.props.renderRightButton)
      await spec.pause(500)
      await spec.press('SideMenu.logout')
      await spec.pause(5000)
      const login = await spec.findComponent('Login.Login')
      console.log(login)
      console.log(login.props.context)
      await helpers.fastLogin(login)
    })
  })
}

// This is for tapping the back button in the control panel scenes.  Add this to each scene to go back ... will need to hook the renderRightButton?
// or hook the button that goes back
// const walletListScene = await spec.findComponent('Main.WalletList')
//       await spec.press(walletListScene.props.renderRightButton)
