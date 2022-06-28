import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)
  spec.describe('Rename Wallets', function () {
    spec.it('From WalletListMenu', async function () {
      await spec.pause(10000)

      const RowId = await help.getWalletListCodes('WalletListSwipeable.WalletId')
      console.log('RowId', RowId)

      //   for (let i = 0; i < RowId.length; i++) {
      await help.longPress(RowId[0].walletId)
      await spec.pause(500)
      await spec.press('WalletListMenuModal.resync')
      await spec.pause(500)
      await spec.press('ResyncWalletModal.confirm')
      await spec.pause(500)
      // check isDone.value
      // all i see when logging sync ratio is 0 or 1
      const isResyncDone = () => {
        while (isDone.value === false) {
          continue
        }
      }
      const intervalResyncCheck = setInterval((isResyncDone, 100))
      const stopInterval = () => {
        clearInterval(intervalResyncCheck)
      }

      setTimeout(stopInterval, 180000)

      //       setTimeout(stop_interval, 12000);
      // function stop_interval()
      // {
      //   clearInterval(setInterval_ID);
      // }
      // Add a function to check the resync status (import watch?) of the wallet
      //  while(syncRatio === false) { continue to check resync status}
      // import walletSyncCircle and then pass in walletRows
      // or use wallet.watch( ) to watch the syncRatio
      //   await spec.press()
    })
  })
}
