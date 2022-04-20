export default function (spec) {
  spec.describe('NavigationBar', function () {
    spec.it('Menu Navigation', async function () {
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
