import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import type { RampPluginFactory, SettlementRange } from '../rampPluginTypes'
import { createExternalRampPlugin } from '../utils/createExternalRampPlugin'
import { asInitOptions } from './libertyxRampTypes'

const SETTLEMENT_INSTANT: SettlementRange = {
  min: { value: 0, unit: 'minutes' },
  max: { value: 0, unit: 'minutes' }
}

export const libertyxRampPlugin: RampPluginFactory = config => {
  const initOptions = asInitOptions(config.initOptions)

  return createExternalRampPlugin(
    'libertyx',
    {
      partnerIcon: initOptions.partnerIcon,
      guiPlugin: guiPlugins.libertyx,
      buy: {
        paymentTypes: ['wire', 'credit'],
        countries: ['US'],
        cryptoAssets: [{ pluginId: 'bitcoin', tokenId: null }],
        settlementRange: SETTLEMENT_INSTANT,
        deepPath: '/',
        deepQuery: undefined
      }
    },
    config
  )
}
