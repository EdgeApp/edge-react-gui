import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)
  spec.describe('Archive Wallets', function () {
    spec.it('From WalletListMenu', async function () {
      await spec.pause(15000)
      // await spec.press('MenuTab.pluginBuy')
      await spec.pause(500)
      const RowId = await help.getWalletListCodes('WalletListSwipeable.WalletId')
      // for (const row of RowId) {
      // for (let i = 0; i < RowId.length; i++) {
      // await help.longPress(row.walletId)
      // await help.longPress(rows[i])
      console.log('length', RowId.length)
      const scrollToLast = await help.scrollWalletList('WalletListSwipeable.WalletId')
      console.log('scrollToLast', scrollToLast)

      // await help.longPress(RowId[0].walletId)
      // await spec.pause(500)
      // await spec.press('WalletListMenuModal.delete')
      // await spec.pause(500)
      // await spec.press('SettingsScene.OpenRestoreWalletsModal')
      // await spec.pause(2000)
      // await spec.press('SettingsActionsRestoreWalletsModal.confirm')
      // if (i === rows.length - 1) {
      //   await spec.press('WalletListMenuAction.CloseLastWalletModal')
      // } else {
      //   await spec.press('DeleteWalletModal.confirm')
      // }
      // }
    })
    // restore wallets 2 times
    // await spec.press('sidemenuButton')
    // await spec.pause(500)
    // await spec.press('settings')
    // await spec.pause(500)
    // await spec.press('SettingsScene.OpenRestoreWalletsModal')
    // await spec.pause(500)
    // await spec.press('RestoreWalletsModal.confirm')
    // await spec.pause(500)
    // await spec.press('sidemenuButton')
    // await spec.pause(500)
    // await spec.press('settings')
    // await spec.pause(500)
    // await spec.press('SettingsScene.OpenRestoreWalletsModal')
    // await spec.pause(500)
    // await spec.press('RestoreWalletsModal.confirm')
    // scroll to the end to confirm the length of array b/c restored wallets go to last index, crorrect?
    //   const scrollToLast = await help.scrollToLastItem('WalletListSwipeable.WalletId')
    //   console.log('scrollToLast', scrollToLast)
  })
}
