// import { MAX_SAFE_INTEGER } from 'core-js/core/number'
import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)
  spec.describe('Send crypto', function () {
    spec.it('From wallet', async function () {
      await spec.pause(25000)
      // await spec.press('MenuTab.pluginBuy')
      // await spec.pause(500)

      // const rows = await help.getWalletListRows('WalletListSwipeable.WalletId')
      // for (let i = 0; i === rows[1]; i++) {
      //   // for (const row of rows) {
      //   await spec.press(rows.walletId)
      await spec.pause(500)
      await spec.press('TransactionListTop.SendButton')
      await spec.pause(500)
      await spec.press('AddressTile.SendEnterAddress')
      await spec.pause(500)
      await spec.fillIn('AddressModal.EnterAddress', 'XqdAyfs3PFszsmwb6SNackWd7nd68PJpsu')
      // put dash address from my wallet
      // how to send to multiple addresses in one test?
      await spec.pause(500)
      await spec.press('AddressModal.SubmitAddress')
      // submit
      await spec.pause(500)
      await spec.press('SendScene.OpenFlipInput')
      await spec.pause(500)
      await spec.press('FlipInputModal.MaxButton')
      await spec.pause(500)
      // send MAX
      // await spec.pause(500)
      //   const EnterFiatAmount = await spec.findComponent(flipInput)
      //  if (EnterFiatAmount.props) {
      //   return EnterFiatAmount.props.onChangeText('40')
      // await help.fillInFlipInput('FlipInput.SendEnterFiatAmount')
      // await spec.pause(500)
      // await spec.fillIn('FlipInput.SendEnterFiatAmount', '40')
      // const EnterFiatAmount = await spec.findComponent('FlipInput.SendEnterFiatAmount')
      // EnterFiatAmount.props.onChangeText('40')
      await spec.pause(1000)
      await help.closeModal('FlipInputModal.Close', 'close')
      await spec.pause(1000)
      const slide = await help.slideConfirm('SendScene.Slider')
      console.log('slide', slide)

      await spec.pause(5000)
      // }
      // need to send the funds back to the original wallet before ending the test
    })
  })
}
