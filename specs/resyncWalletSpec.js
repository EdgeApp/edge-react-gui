import { helpers } from './helpers.js'

const MAX_SYNC_TIME = 120000

export default function (spec) {
  const help = helpers(spec)
  spec.describe('Resync wallets', function () {
    spec.it('Wallet List Menu', async function () {
      await help.waitTransition()
      await spec.press('MenuTab.walletList')
      await help.waitTransition()
      const rows = await help.getWalletListRows('WalletListScene.WalletList')
      for (const row of rows) {
        console.log('pre-resync', row)
        // the type of the row is the walletListItem
        await help.longPress(row.onLongPress)
        await help.longPress(row)
        await help.waitTransition()
        await spec.press('WalletListMenuModal.resync')
        await help.waitTransition()
        await help.resolveModal('ResyncWalletModal.ResyncButtons', 'confirm')
        setTimeout(() => {
          console.log('post-resync', row)
          // verify that the row has synced
        }, MAX_SYNC_TIME)
      }
      await help.waitTransition()
    })
  })
}
