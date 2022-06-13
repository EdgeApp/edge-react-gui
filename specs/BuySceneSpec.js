import { helpers } from './helpers.js'

export default function (spec) {
  const help = helpers(spec)

  spec.describe('Buy Scene', function () {
    spec.it('Navigation', async function () {
      // initializing navigation starting point
      await spec.pause(25000)
      await help.navigate('MenuTab.walletList')

      // Buy

      await help.navigate('MenuTab', 'pluginBuy')
      await help.navigate('PluginScene', 'OpenCountryList')
      await help.navigate('AF', 'Select')
    })
  })
}
