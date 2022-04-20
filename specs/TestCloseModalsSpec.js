export default function (spec) {
  spec.describe('ControlPanel', function () {
    spec.it('option navigation', async function () {
      await spec.pause(20000)
      await spec.press('SpendingLimitsScene.Back')
      await spec.pause(5000)
      await spec.press('TermsOfServiceScene.Back')
      await spec.pause(5000)
      await spec.press('WcConnectionsScene.Back')
      await spec.pause(5000)

      // await help.resolveModal('RequestScene.Back', 'confirm')
      await spec.pause(2000)
    })
  })
}
