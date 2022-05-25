// import { helpers } from './helpers.js'

export default function (spec) {
  // const help = helpers(spec)

  spec.describe('ControlPanel', function () {
    spec.it('option navigation', async function () {
      await spec.pause(10000)
      await spec.findComponent('CryptoExchangeScene.WalletList')
      await spec.press('CryptoExchangeScene.WalletList')
      await spec.pause(2000)

      // await help.resolveModal('RequestScene.Back', 'confirm')
      // await spec.pause(2000)
    })
  })
}
