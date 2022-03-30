import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)
  spec.describe('MenuTab', function () {
    spec.it('Menu Navigation', async function () {
      await help.waitTransition()
      await spec.pause(5000)
      await spec.press('MenuTab.pluginBuy')
      await spec.pause(500)
      await spec.press('MenuTab.pluginSell')
      await spec.pause(500)
      await spec.press('MenuTab.exchange')
      await spec.pause(500)
      await spec.press('MenuTab.walletList')
    })
  })
}
