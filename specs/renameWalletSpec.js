import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)
  spec.describe('Rename Wallets', function () {
    spec.it('From WalletListMenu', async function () {
      await spec.pause(10000)

      const RowId = await help.getWalletListCodes('WalletListSwipeable.WalletId')
      await help.longPress(RowId[0].walletId)
      await spec.pause(500)
      await spec.press('WalletListMenuModal.rename')
      await spec.pause(500)
      await spec.fillIn('WalletListMenuAction.RenameWallet', 'renamed wallet test')
      await spec.pause(500)
      await spec.press('RenameWalletModal.SubmitName')
      await spec.pause(1000)

      const renamedWalletValue = await help.getWalletNameValue('WalletListSwipeable.WalletId')
      if (renamedWalletValue.length !== 19) {
        throw new Error('Incorrect Wallet Name')
      }
      await help.longPress(RowId[0].walletId)
      await spec.pause(500)
      await spec.press('WalletListMenuModal.rename')
      await spec.pause(500)
      await spec.fillIn('WalletListMenuAction.RenameWallet', 'My Wallet')
      await spec.pause(500)
      await spec.press('RenameWalletModal.SubmitName')
    })
  })
}

// test format with snapshots
// await help.navigate('MenuTab', 'walletList')
// const RowId = await help.getWalletListCodes('WalletListSwipeable.WalletId')
//   await help.longPress(RowId[0].walletId)
//   await spec.pause(500)
// await help.navigate('WalletListMenuModal', 'rename')
// await spec.fillIn('WalletListMenuAction.RenameWallet', 'renamed wallet test')
// await spec.pause(500)
// await help.navigate('RenameWalletModal', 'SubmitName')
//   const renamedWalletLength = await help.getWalletName('WalletListSwipeable.WalletId')
//   if (renamedWalletLength.length !== 19) {
//     throw new Error('Incorrect Wallet Name')
//   }
//   await help.longPress(RowId[0].walletId)
//   await spec.pause(500)
// await help.navigate('WalletListMenuModal', 'rename')
// await spec.fillIn('WalletListMenuAction.RenameWallet', 'My Wallet')
//           await spec.pause(500)
// await help.navigate('RenameWalletModal', 'SubmitName')
