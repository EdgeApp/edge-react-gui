import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)

  spec.describe('Add Wallet', function () {
    spec.it('Navigation', async function () {
      // initializing navigation starting point
      await spec.pause(20000)
      await help.navigate('MenuTab', 'walletList')

      // Add wallet

      await help.navigate('WalletListFooter', 'AddWallet')
      const walletRows = await help.getWalletListData('CreateWalletSelectCryptoScene.CurrencyCodeList')
      const row = walletRows[0]
      await help.navigate('CreateCryptoWalletScene', `${row.walletType}Row`)
      const fiatRows = await help.getFiatList('CreateWalletSelectFiatScene.FiatList')
      await spec.press(fiatRows[0].value)
      await help.navigate('CreateWalletNameScene', 'NextButton')
      await help.navigateBack('CreateWalletReviewScene')
      await help.navigateBack('CreateWalletName')
      await help.navigateBack('CreateWalletSelectFiatScene')
      await help.navigateBack('CreateWalletSelectCryptoScene')
      await spec.pause(500)
    })
  })
}
