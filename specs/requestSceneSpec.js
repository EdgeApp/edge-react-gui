import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)

  spec.describe('Request Scene', function () {
    spec.it('Navigation', async function () {
      // initializing navigation starting point
      await spec.pause(20000)
      await help.navigate('MenuTab', 'walletList')

      // request scene

      const rows = await help.getWalletListRows('SwipeableWalletList.WalletId')
      await spec.press(rows[0].walletId)
      await spec.pause(500)
      await help.navigate('TransactionListTop', 'RequestButton')
      await help.navigate('RequestScene', 'OpenQr')
      await help.navigate('QrModal', 'Close')
      await help.navigateBack('RequestScene')
      await help.navigateBack('TransactionList')
    })
  })
}
