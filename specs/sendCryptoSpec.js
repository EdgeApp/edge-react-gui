import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)

  spec.describe('Send Crypto', function () {
    spec.it('Navigation', async function () {
      // initializing navigation starting point
      await spec.pause(25000)
      await help.navigate('MenuTab', 'walletList')

      // send crypto

      const listRows = await help.getWalletListRows('SwipeableWalletList.WalletId')
      await spec.press(listRows[0].walletId)
      await help.navigate('TransactionListTop', 'SendButton')
      await help.navigate('AddressTile', 'SendEnterAddress')
      await spec.fillIn('AddressModal.EnterAddress', '0x749411cf4da88194581921ae55f6fc4357d3b0f2')
      await spec.pause(500)
      await help.navigate('AddressModal', 'SubmitAddress')
      await help.navigate('SendScene', 'OpenFlipInput')
      await help.navigate('FlipInputModal', 'SendMaxButton')
      await help.resolveModal('FlipInputModal.Close', 'close')
      await spec.pause(1000)
      await help.navigateBack('SendScene')
      await help.navigateBack('TransactionList')
    })
  })
}
