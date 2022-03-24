// import { MainComponent } from '../src/components/Main.ui'
// I am using components from Main.ui and ControlPanel
export default function (spec) {
  spec.describe('ControlPanel', function () {
    spec.it('option navigation', async function () {
      await spec.pause(1000)
      const walletListScene = await spec.findComponent('Main.WalletList')
      await spec.press(walletListScene.props.renderRightButton)
      await spec.pause(200)
      await spec.press('SideMenu.fio-names')
      await spec.pause(200)
      const FioAddressListScene = await spec.findComponent('Main.FioNames')
      await spec.press(FioAddressListScene.props.renderLeftButton)
      // Left or right?
      await spec.pause(200)
      await spec.findComponent('Main.WalletList')
      await spec.press(walletListScene.props.renderRightButton)
      await spec.pause(200)
      await spec.press('SideMenu.FioRequestListScene')
      await spec.pause(200)

      await spec.press('MenuTab.exchange')
      await spec.pause(200)
      await spec.press('MenuTab.walletList')
    })
  })
}

// This is for tapping the back button in the control panel scenes.  Add this to each scene to go back ... will need to hook the renderRightButton?
// or hook the button that goes back
// const walletListScene = await spec.findComponent('Main.WalletList')
//       await spec.press(walletListScene.props.renderRightButton)
