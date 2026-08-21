import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import type { RampPluginFactory, SettlementRange } from '../rampPluginTypes'
import { createExternalRampPlugin } from '../utils/createExternalRampPlugin'
import { asInitOptions } from './coinhubRampTypes'

const SETTLEMENT_INSTANT: SettlementRange = {
  min: { value: 0, unit: 'minutes' },
  max: { value: 0, unit: 'minutes' }
}

/**
 * The Coinhub ATM network, reached through the Coinhub website. The machines
 * take whichever asset the customer brings, so neither direction restricts the
 * crypto assets.
 */
export const coinhubAtmRampPlugin: RampPluginFactory = config => {
  const initOptions = asInitOptions(config.initOptions)

  return createExternalRampPlugin(
    'coinhubatm',
    {
      partnerIcon: initOptions.partnerIcon,
      guiPlugin: guiPlugins.coinhub,
      buy: {
        paymentTypes: ['cash'],
        countries: ['US'],
        settlementRange: SETTLEMENT_INSTANT,
        deepPath: '/buy-atms'
      },
      sell: {
        paymentTypes: ['cash'],
        countries: ['US'],
        settlementRange: SETTLEMENT_INSTANT,
        deepPath: '/sell-atms'
      }
    },
    config
  )
}
