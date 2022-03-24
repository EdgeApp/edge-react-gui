// import { MenuTab } from '../src/components/themed/MenuTab'

export default function (spec) {
  spec.describe('MenuTab', function () {
    spec.it('Menu Navigation', async function () {
      // do I need to have a spec to find the MenuTab component? and/or do what do I need to import?
      await spec.pause(1000)
      await spec.press('MenuTab.pluginBuy')
      await spec.pause(200)
      await spec.press('MenuTab.pluginSell')
      await spec.pause(200)
      await spec.press('MenuTab.exchange')
      await spec.pause(200)
      await spec.press('MenuTab.walletList')
    })
  })
}
