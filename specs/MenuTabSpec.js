export default function (spec) {
  spec.describe('MenuTab', function () {
    spec.it('Menu Navigation', async function () {
      await spec.pause(10000)
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
