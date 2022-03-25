import {} from './helpers.js'

export default function (spec) {
  spec.describe('Resync wallets', function () {
    spec.it('Wallet List Menu', async function () {})
  })
}

// need to map over the wallet list and for each wallet we need to find the component and the WalletListMenuActions / The Resync Modal
// do this for every wallet present in the wallet list
// after resync, the modal closes and the next wallet is selected
// do I need to select each wallet or just the Resync modal?
// if the resync does not complete after 5 min.. fail
//
