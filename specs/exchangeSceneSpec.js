import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)

  spec.describe('Exchange Scene', function () {
    spec.it('Navigation', async function () {
      // initializing navigation starting point
      await spec.pause(25000)
      await help.navigate('MenuTab', 'walletList')

      // exchange

      await help.navigate('MenuTab', 'exchange')
      await help.navigate('ExchangeScene', 'FromWalletList')
      await help.closeModal('WalletListModal')
      await help.navigate('ExchangeScene', 'ToWalletList')
      await help.closeModal('WalletListModal')
    })
  })
}
