import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import type { RampPluginFactory, SettlementRange } from '../rampPluginTypes'
import { createExternalRampPlugin } from '../utils/createExternalRampPlugin'
import { asInitOptions } from './coinhubRampTypes'

const SETTLEMENT_ONE_TO_FORTY_EIGHT_HOURS: SettlementRange = {
  min: { value: 1, unit: 'hours' },
  max: { value: 48, unit: 'hours' }
}

/**
 * Coinhub Funded prop-trading accounts. Buy only, and like the exchange it is a
 * whole website of its own, so it opens in the device browser. Its payment type
 * differs from the exchange's on purpose: the quote scene renders one card per
 * payment type, so sharing `wire` would bury one Coinhub destination inside the
 * other's provider dropdown.
 */
export const coinhubFundedRampPlugin: RampPluginFactory = config => {
  const initOptions = asInitOptions(config.initOptions)

  return createExternalRampPlugin(
    'coinhubfunded',
    {
      partnerIcon: initOptions.partnerIcon,
      guiPlugin: guiPlugins.coinhubfunded,
      buy: {
        paymentTypes: ['iobank'],
        countries: ['US'],
        settlementRange: SETTLEMENT_ONE_TO_FORTY_EIGHT_HOURS,
        deepPath: '/'
      }
    },
    config
  )
}
